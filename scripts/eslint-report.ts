#!/usr/bin/env ts-node

/**
 * Seatbelt baseline dashboard — parses eslint.seatbelt.tsv and emits an HTML report
 * with aggregated tables and optional git history charts (Chart.js via CDN).
 *
 * After writing, opens the report in your default browser unless --no-open is used or CI is set.
 * When the history chart is included, Chart.js is downloaded next to the HTML so file:// opens work;
 * tables work offline without Chart.js.
 */
import {execSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import CLI from './utils/CLI';
import Git from './utils/Git';

const SEATBELT_REL = 'config/eslint/eslint.seatbelt.tsv';

/** Pinned Chart.js for reproducible reports (UMD build). */
const CHART_JS_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js';

/** Written beside the HTML so `file://` loads work (remote scripts from disk are unreliable). */
const CHART_BUNDLE_FILENAME = 'eslint-report.chart.umd.min.js';

/**
 * Download Chart.js UMD next to the report HTML (same directory as output path).
 */
async function saveChartJsBesideHtml(htmlAbsPath: string): Promise<{ok: true} | {ok: false; message: string}> {
    const dest = path.join(path.dirname(htmlAbsPath), CHART_BUNDLE_FILENAME);
    try {
        const res = await fetch(CHART_JS_CDN);
        if (!res.ok) {
            return {ok: false, message: `HTTP ${res.status}`};
        }
        fs.writeFileSync(dest, await res.text(), 'utf8');
        return {ok: true};
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {ok: false, message};
    }
}

type SeatbeltRow = {
    rawPath: string;
    rule: string;
    count: number;
};

type Aggregates = {
    byRule: Map<string, number>;
    byFile: Map<string, number>;
    grandTotal: number;
};

type GitCommitPoint = {
    hash: string;
    isoDate: string;
};

type HistorySnapshot = {
    commit: GitCommitPoint;
    aggregates: Aggregates;
};

function stripQuotes(field: string): string {
    const t = field.trim();
    if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
        return t.slice(1, -1);
    }
    return t;
}

function parseSeatbeltTsv(content: string): SeatbeltRow[] {
    const rows: SeatbeltRow[] = [];
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const parts = trimmed.split('\t');
        if (parts.length !== 3) {
            // eslint-disable-next-line no-console
            console.warn(`eslint-report: skipping malformed line (${parts.length} columns): ${trimmed.slice(0, 120)}`);
            continue;
        }
        const rawPath = stripQuotes(parts.at(0) ?? '');
        const rule = stripQuotes(parts.at(1) ?? '');
        const countStr = parts.at(2) ?? '';
        const count = Number.parseInt(countStr.trim(), 10);
        if (!Number.isFinite(count) || count < 0) {
            // eslint-disable-next-line no-console
            console.warn(`eslint-report: skipping bad count for ${rawPath}: ${countStr}`);
            continue;
        }
        rows.push({rawPath, rule, count});
    }
    return rows;
}

function normalizeFilePath(projectRoot: string, seatbeltDir: string, rawPath: string): string {
    const abs = path.resolve(seatbeltDir, rawPath);
    const rel = path.relative(projectRoot, abs);
    return rel.split(path.sep).join('/');
}

function aggregate(rows: SeatbeltRow[], projectRoot: string, seatbeltDir: string): Aggregates {
    const byRule = new Map<string, number>();
    const byFile = new Map<string, number>();
    let grandTotal = 0;
    for (const row of rows) {
        grandTotal += row.count;
        const fileKey = normalizeFilePath(projectRoot, seatbeltDir, row.rawPath);
        byRule.set(row.rule, (byRule.get(row.rule) ?? 0) + row.count);
        byFile.set(fileKey, (byFile.get(fileKey) ?? 0) + row.count);
    }
    return {byRule, byFile, grandTotal};
}

function sortedEntries(map: Map<string, number>): Array<[string, number]> {
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Read seatbelt TSV at a commit. Uses Git.show (cwd must be the App repo root).
 */
function trySeatbeltAtCommit(hash: string): string | null {
    try {
        return Git.show(hash, SEATBELT_REL);
    } catch {
        return null;
    }
}

/** Requires cwd = App repo root (see runReport chdir). */
function getGitHeadShort(): string {
    try {
        return execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
    } catch {
        return 'unknown';
    }
}

/** Requires cwd = App repo root. Git.ts has no wrapper for git log. */
function listSeatbeltCommits(limit: number): GitCommitPoint[] {
    try {
        const out = execSync(`git log --reverse --format=%H%x09%cI -n ${limit} -- ${SEATBELT_REL}`, {
            encoding: 'utf8',
        }).trim();
        if (!out) {
            return [];
        }
        return out.split('\n').map((line) => {
            const [hash, isoDate] = line.split('\t');
            return {hash, isoDate};
        });
    } catch {
        return [];
    }
}

function buildHistory(projectRoot: string, seatbeltDir: string, gitLimit: number): HistorySnapshot[] {
    const commits = listSeatbeltCommits(gitLimit);
    const snapshots: HistorySnapshot[] = [];
    for (const commit of commits) {
        const content = trySeatbeltAtCommit(commit.hash);
        if (content === null) {
            continue;
        }
        const rows = parseSeatbeltTsv(content);
        snapshots.push({
            commit,
            aggregates: aggregate(rows, projectRoot, seatbeltDir),
        });
    }
    return snapshots;
}

function escapeHtml(s: string): string {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/** Distinct colors for rule lines (Chart.js dataset borderColor). */
const RULE_LINE_COLORS = [
    'rgb(220, 53, 69)',
    'rgb(255, 159, 64)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(54, 162, 235)',
    'rgb(153, 102, 255)',
    'rgb(201, 203, 207)',
    'rgb(102, 187, 106)',
    'rgb(255, 112, 67)',
    'rgb(126, 87, 194)',
];

type ChartPayload = {
    labels: string[];
    total: number[];
    /** Keys align with topRules; each entry is counts per commit for that rule */
    ruleSeries: Array<{rule: string; counts: number[]}>;
};

function buildChartPayload(history: HistorySnapshot[], topRules: string[]): ChartPayload | null {
    if (!history.length) {
        return null;
    }
    const labels = history.map((h) => {
        const d = new Date(h.commit.isoDate);
        return Number.isNaN(d.getTime()) ? h.commit.isoDate.slice(0, 10) : d.toISOString().slice(0, 10);
    });
    const total = history.map((h) => h.aggregates.grandTotal);
    const ruleSeries = topRules.map((rule) => ({
        rule,
        counts: history.map((h) => h.aggregates.byRule.get(rule) ?? 0),
    }));
    return {labels, total, ruleSeries};
}

function renderHtml(opts: {
    generatedIso: string;
    gitHead: string;
    grandTotal: number;
    uniqueFiles: number;
    uniqueRules: number;
    ruleRows: Array<[string, number]>;
    fileRows: Array<[string, number]>;
    chartPayload: ChartPayload | null;
    /** Relative script URL (e.g. ./eslint-report.chart.umd.min.js) when chart is included; omit Chart otherwise. */
    chartScriptSrc: string | null;
    chartWarning: string | null;
}): string {
    const chartJson = JSON.stringify(opts.chartPayload);
    const chartBundles =
        opts.chartPayload && opts.chartScriptSrc
            ? `<script type="application/json" id="eslint-report-data">${chartJson}</script>
  <script src="${escapeHtml(opts.chartScriptSrc)}"></script>`
            : '';
    const ruleRowsHtml = opts.ruleRows.map(([rule, n]) => `<tr><td>${escapeHtml(rule)}</td><td class="num">${n}</td></tr>`).join('\n');
    const fileRowsHtml = opts.fileRows.map(([file, n]) => `<tr><td class="path">${escapeHtml(file)}</td><td class="num">${n}</td></tr>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>ESLint seatbelt baseline</title>
  <style>
    :root { font-family: system-ui, sans-serif; line-height: 1.4; color: #111; background: #fafafa; }
    body { margin: 0 auto; max-width: 1200px; padding: 1rem 1.5rem 3rem; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .muted { color: #555; font-size: 0.9rem; }
    .summary { margin: 1rem 0 1.5rem; padding: 0.75rem 1rem; background: #fff; border: 1px solid #ddd; border-radius: 6px; }
    .summary dl { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; margin: 0; }
    .summary dt { font-weight: 600; }
    section { margin-bottom: 2rem; }
    h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; font-size: 0.9rem; }
    th, td { padding: 0.45rem 0.65rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f0f0f0; cursor: pointer; user-select: none; }
    th:hover { background: #e8e8e8; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.path { word-break: break-all; font-size: 0.82rem; }
    .chart-wrap { position: relative; height: 380px; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem; }
    .chart-controls { margin: 0.5rem 0; display: flex; flex-wrap: wrap; gap: 0.65rem 1rem; align-items: center; font-size: 0.88rem; }
    .chart-controls label { display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; }
    footer { margin-top: 2rem; font-size: 0.85rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; }
  </style>
</head>
<body>
  <h1>ESLint seatbelt baseline</h1>
  <p class="muted">Grandfathered allowances from <code>eslint.seatbelt.tsv</code> — not a live ESLint run.</p>

  <div class="summary">
    <dl>
      <dt>Generated</dt><dd>${escapeHtml(opts.generatedIso)}</dd>
      <dt>Git HEAD</dt><dd>${escapeHtml(opts.gitHead)}</dd>
      <dt>Total grandfathered violations</dt><dd>${opts.grandTotal}</dd>
      <dt>Files with allowances</dt><dd>${opts.uniqueFiles}</dd>
      <dt>Distinct rules</dt><dd>${opts.uniqueRules}</dd>
    </dl>
  </div>

  <section>
    <h2>History (${opts.chartPayload ? opts.chartPayload.labels.length : 0} commits)</h2>
    ${opts.chartWarning ? `<p class="muted">${escapeHtml(opts.chartWarning)}</p>` : ''}
    ${
        opts.chartPayload
            ? `<div class="chart-controls" id="chart-toggles"></div>
    <div class="chart-wrap"><canvas id="history-chart" aria-label="Seatbelt totals over git history"></canvas></div>`
            : '<p class="muted">No chart data.</p>'
    }
  </section>

  <section>
    <h2>By rule</h2>
    <table id="table-rules">
      <thead><tr><th data-sort="str">Rule</th><th class="num" data-sort="num">Count</th></tr></thead>
      <tbody>${ruleRowsHtml}</tbody>
    </table>
  </section>

  <section>
    <h2>By file</h2>
    <table id="table-files">
      <thead><tr><th data-sort="str">File</th><th class="num" data-sort="num">Count</th></tr></thead>
      <tbody>${fileRowsHtml}</tbody>
    </table>
  </section>

  <footer>
    ${
        opts.chartScriptSrc
            ? `<p>Chart.js is saved beside this report as <code>${escapeHtml(CHART_BUNDLE_FILENAME)}</code> (from ${escapeHtml(
                  CHART_JS_CDN,
              )}) so opening via <code>file://</code> still loads the chart.</p>`
            : ''
    }
    <p class="muted">Rule/file tables sort via the inline script below.</p>
  </footer>

  ${chartBundles}
  <script>
(function () {
  var dataEl = document.getElementById('eslint-report-data');
  var payload = dataEl ? JSON.parse(dataEl.textContent || 'null') : null;

  function sortTable(tableId, colIndex, numeric) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var ca = a.cells[colIndex].textContent.trim();
      var cb = b.cells[colIndex].textContent.trim();
      if (numeric) {
        return Number(cb) - Number(ca);
      }
      return ca.localeCompare(cb);
    });
    rows.forEach(function (row) { tbody.appendChild(row); });
  }

  document.querySelectorAll('#table-rules thead th').forEach(function (th, i) {
    th.addEventListener('click', function () {
      sortTable('table-rules', i, th.dataset.sort === 'num');
    });
  });
  document.querySelectorAll('#table-files thead th').forEach(function (th, i) {
    th.addEventListener('click', function () {
      sortTable('table-files', i, th.dataset.sort === 'num');
    });
  });

  if (!payload || typeof Chart === 'undefined') {
    return;
  }

  var labels = payload.labels;
  var datasets = [{
    label: 'Total',
    data: payload.total,
    borderColor: 'rgb(33, 37, 41)',
    backgroundColor: 'rgba(33, 37, 41, 0.06)',
    tension: 0.15,
    fill: false,
    borderWidth: 2,
    pointRadius: 2,
  }];

  var palette = ${JSON.stringify(RULE_LINE_COLORS)};
  (payload.ruleSeries || []).forEach(function (rs, idx) {
    var c = palette[idx % palette.length];
    datasets.push({
      label: rs.rule,
      data: rs.counts,
      borderColor: c,
      backgroundColor: 'transparent',
      tension: 0.15,
      fill: false,
      borderWidth: 1.5,
      pointRadius: 0,
      hidden: true,
    });
  });

  var toggleRoot = document.getElementById('chart-toggles');
  if (toggleRoot) {
    datasets.forEach(function (ds, i) {
      var lab = document.createElement('label');
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.id = 'eslint-seatbelt-ds-' + i;
      inp.checked = ds.hidden !== true;
      inp.dataset.index = String(i);
      var span = document.createElement('span');
      span.textContent = ds.label;
      lab.appendChild(inp);
      lab.appendChild(span);
      toggleRoot.appendChild(lab);
    });
  }

  var ctx = document.getElementById('history-chart');
  if (!ctx) return;

  var chart = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: { beginAtZero: true },
      },
    },
  });

  if (toggleRoot) {
    toggleRoot.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = Number(inp.dataset.index);
        chart.setDatasetVisibility(idx, inp.checked);
        chart.update();
      });
    });
  }
})();
  </script>
</body>
</html>`;
}

/**
 * Open an HTML file with the OS default handler (typically your default browser).
 */
function openHtmlReport(absPath: string): void {
    const absolute = path.resolve(absPath);
    if (process.platform === 'darwin') {
        spawnSync('open', [absolute], {stdio: 'ignore'});
    } else if (process.platform === 'win32') {
        // `start "" <path>` uses the empty window title so paths with spaces work.
        spawnSync('cmd', ['/c', 'start', '', absolute], {stdio: 'ignore', windowsHide: true});
    } else {
        spawnSync('xdg-open', [absolute], {stdio: 'ignore'});
    }
}

function main(): void {
    runReport().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
}

async function runReport(): Promise<void> {
    const projectRoot = path.resolve(__dirname, '..');
    const seatbeltPath = path.join(projectRoot, SEATBELT_REL);
    const seatbeltDir = path.dirname(seatbeltPath);

    /* CLI argv uses kebab-case for flags documented in help */
    /* eslint-disable @typescript-eslint/naming-convention */
    const cli = new CLI({
        namedArgs: {
            output: {
                description: 'Output HTML path (relative to App repo root unless absolute)',
                default: path.join('reports', 'eslint-report.html'),
            },
            'git-limit': {
                description: 'Max commits for history chart',
                default: 200,
                parse: (val) => {
                    const n = Number.parseInt(val, 10);
                    if (!Number.isFinite(n) || n < 1) {
                        throw new Error('Must be a positive integer');
                    }
                    return n;
                },
            },
            'top-rules': {
                description: 'Top N rules for optional trend lines',
                default: 10,
                parse: (val) => {
                    const n = Number.parseInt(val, 10);
                    if (!Number.isFinite(n) || n < 0) {
                        throw new Error('Must be a non-negative integer');
                    }
                    return n;
                },
            },
        },
        flags: {
            'no-open': {
                description: 'Do not open the report in the browser after writing (also skipped when CI is set)',
            },
        },
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    const output = cli.namedArgs.output;
    const gitLimit = cli.namedArgs['git-limit'];
    const topRules = cli.namedArgs['top-rules'];
    const openReport = !cli.flags['no-open'];

    if (!fs.existsSync(seatbeltPath)) {
        // eslint-disable-next-line no-console
        console.error(`eslint-report: seatbelt file not found: ${seatbeltPath}`);
        process.exit(1);
    }

    const tsvContent = fs.readFileSync(seatbeltPath, 'utf8');
    const rows = parseSeatbeltTsv(tsvContent);
    const agg = aggregate(rows, projectRoot, seatbeltDir);

    const ruleRows = sortedEntries(agg.byRule);
    const fileRows = sortedEntries(agg.byFile);

    const prevCwd = process.cwd();
    process.chdir(projectRoot);
    let gitHead: string;
    let history: HistorySnapshot[];
    try {
        gitHead = getGitHeadShort();
        history = buildHistory(projectRoot, seatbeltDir, gitLimit);
    } finally {
        process.chdir(prevCwd);
    }

    const topRuleNames = ruleRows.slice(0, topRules).map(([r]) => r);
    let chartPayload = buildChartPayload(history, topRuleNames);
    let chartWarning: string | null = null;
    if (!history.length) {
        chartWarning = 'No git history for eslint.seatbelt.tsv (not a git repo, or file never committed).';
        chartPayload = null;
    }

    const outAbs = path.isAbsolute(output) ? output : path.join(projectRoot, output);
    fs.mkdirSync(path.dirname(outAbs), {recursive: true});

    let chartScriptSrc: string | null = null;
    if (chartPayload) {
        const saved = await saveChartJsBesideHtml(outAbs);
        if (!saved.ok) {
            throw new Error(`eslint-report: could not download Chart.js: ${saved.message}`);
        }
        chartScriptSrc = `./${CHART_BUNDLE_FILENAME}`;
    }

    const html = renderHtml({
        generatedIso: new Date().toISOString(),
        gitHead,
        grandTotal: agg.grandTotal,
        uniqueFiles: agg.byFile.size,
        uniqueRules: agg.byRule.size,
        ruleRows,
        fileRows,
        chartPayload,
        chartScriptSrc,
        chartWarning,
    });

    fs.writeFileSync(outAbs, html, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`eslint-report: wrote ${outAbs}`);

    const shouldOpen = openReport && !process.env.CI;
    if (shouldOpen) {
        try {
            openHtmlReport(outAbs);
        } catch {
            // eslint-disable-next-line no-console
            console.warn('eslint-report: could not open report in browser (display unavailable?)');
        }
    }
}

main();
