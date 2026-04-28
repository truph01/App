#!/usr/bin/env ts-node

/**
 * Seatbelt baseline dashboard — parses eslint.seatbelt.tsv and emits an HTML report
 * with aggregated tables and optional git history charts (Chart.js pinned beside the HTML).
 *
 * Styling uses the same dark palette as src/styles/theme/themes/dark.ts via @styles/theme/colors.
 *
 * After writing, opens the report in your default browser unless --no-open is used or CI is set.
 * When the history chart is included, Chart.js is downloaded next to the HTML so file:// opens work;
 * tables work offline without Chart.js.
 */
import {execSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import colors from '@styles/theme/colors';
import CLI from './utils/CLI';
import Git from './utils/Git';

const SEATBELT_REL = 'config/eslint/eslint.seatbelt.tsv';

/** Pinned Chart.js for reproducible reports (UMD build). */
const CHART_JS_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js';

/** Written beside the HTML so `file://` loads work (remote scripts from disk are unreliable). */
const CHART_BUNDLE_FILENAME = 'eslint-report.chart.umd.min.js';

/**
 * Semantic colors aligned with src/styles/theme/themes/dark.ts (dark theme).
 * Font stacks match src/styles/utils/FontUtils/fontFamily/multiFontFamily (web-safe fallbacks).
 */
const REPORT_BODY_FONT = `'Expensify Neue', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const REPORT_MONO_FONT = `'Expensify Mono', ui-monospace, 'Segoe UI Mono', 'Menlo', monospace`;

const REPORT_THEME = {
    appBG: colors.productDark100,
    cardBG: colors.productDark200,
    border: colors.productDark400,
    borderRow: colors.productDark400,
    tableHeaderBG: colors.productDark300,
    tableHeaderHoverBG: colors.productDark400,
    text: colors.productDark900,
    textSupporting: colors.productDark800,
    heading: colors.productDark900,
    link: colors.blue300,
    codeBG: colors.productDark300,
    chartSurface: colors.productDark200,
    footerBorder: colors.productDark400,
    accent: colors.green400,
} as const;

/** Distinct rule trend lines on dark chart surface (from theme palette). */
const CHART_RULE_PALETTE = [
    colors.blue300,
    colors.tangerine300,
    colors.ice300,
    colors.pink300,
    colors.yellow300,
    colors.green300,
    colors.blue200,
    colors.tangerine200,
    colors.ice400,
    colors.pink400,
];

/** Encode #RRGGBB + alpha for Chart.js / CSS. */
const hexWithAlpha = (hex: string, alpha: number): string => {
    const n = hex.replace('#', '');
    const r = Number.parseInt(n.slice(0, 2), 16);
    const g = Number.parseInt(n.slice(2, 4), 16);
    const b = Number.parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

type ChartUiPayload = {
    totalLine: string;
    totalFill: string;
    tick: string;
    grid: string;
    legend: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    rulePalette: string[];
};

const buildChartUiPayload = (): ChartUiPayload => ({
    totalLine: REPORT_THEME.accent,
    totalFill: hexWithAlpha(REPORT_THEME.accent, 0.12),
    tick: colors.productDark800,
    grid: hexWithAlpha(colors.productDark700, 0.35),
    legend: colors.productDark900,
    tooltipBg: colors.productDark400,
    tooltipBorder: colors.productDark500,
    tooltipText: colors.productDark900,
    rulePalette: [...CHART_RULE_PALETTE],
});

/**
 * Download Chart.js UMD next to the report HTML (same directory as output path).
 */
const saveChartJsBesideHtml = async (htmlAbsPath: string): Promise<{ok: true} | {ok: false; message: string}> => {
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
};

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

const stripQuotes = (field: string): string => {
    const t = field.trim();
    if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
        return t.slice(1, -1);
    }
    return t;
};

const parseSeatbeltTsv = (content: string): SeatbeltRow[] => {
    const rows: SeatbeltRow[] = [];
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const parts = trimmed.split('\t');
        if (parts.length !== 3) {
            console.warn(`eslint-report: skipping malformed line (${parts.length} columns): ${trimmed.slice(0, 120)}`);
            continue;
        }
        const rawPath = stripQuotes(parts.at(0) ?? '');
        const rule = stripQuotes(parts.at(1) ?? '');
        const countStr = parts.at(2) ?? '';
        const count = Number.parseInt(countStr.trim(), 10);
        if (!Number.isFinite(count) || count < 0) {
            console.warn(`eslint-report: skipping bad count for ${rawPath}: ${countStr}`);
            continue;
        }
        rows.push({rawPath, rule, count});
    }
    return rows;
};

const normalizeFilePath = (projectRoot: string, seatbeltDir: string, rawPath: string): string => path.relative(projectRoot, path.resolve(seatbeltDir, rawPath)).split(path.sep).join('/');

const aggregate = (rows: SeatbeltRow[], projectRoot: string, seatbeltDir: string): Aggregates => {
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
};

const sortedEntries = (map: Map<string, number>): Array<[string, number]> => [...map.entries()].sort((a, b) => b[1] - a[1]);

/**
 * Read seatbelt TSV at a commit. Uses Git.show (cwd must be the App repo root).
 */
const trySeatbeltAtCommit = (hash: string): string | null => {
    try {
        return Git.show(hash, SEATBELT_REL);
    } catch {
        return null;
    }
};

/** Requires cwd = App repo root (see runReport chdir). */
const getGitHeadShort = (): string => {
    try {
        return execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
    } catch {
        return 'unknown';
    }
};

/** Requires cwd = App repo root. Git.ts has no wrapper for git log. */
const listSeatbeltCommits = (limit: number): GitCommitPoint[] => {
    try {
        const out = execSync(`git log --reverse --format=%H%x09%cI -n ${limit} -- ${SEATBELT_REL}`, {
            encoding: 'utf8',
        }).trim();
        if (!out) {
            return [];
        }
        const commits: GitCommitPoint[] = [];
        for (const line of out.split('\n')) {
            const [hash, isoDate] = line.split('\t');
            commits.push({hash, isoDate});
        }
        return commits;
    } catch {
        return [];
    }
};

const buildHistory = (projectRoot: string, seatbeltDir: string, gitLimit: number): HistorySnapshot[] => {
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
};

const escapeHtml = (s: string): string => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

type ChartPayload = {
    labels: string[];
    total: number[];
    /** Keys align with topRules; each entry is counts per commit for that rule */
    ruleSeries: Array<{rule: string; counts: number[]}>;
    ui: ChartUiPayload;
};

const commitDayLabel = (isoDate: string): string => {
    const d = new Date(isoDate);
    return Number.isNaN(d.getTime()) ? isoDate.slice(0, 10) : d.toISOString().slice(0, 10);
};

const buildChartPayload = (history: HistorySnapshot[], topRules: string[]): ChartPayload | null => {
    if (!history.length) {
        return null;
    }
    const labels: string[] = [];
    const total: number[] = [];
    for (const h of history) {
        labels.push(commitDayLabel(h.commit.isoDate));
        total.push(h.aggregates.grandTotal);
    }
    const ruleSeries: Array<{rule: string; counts: number[]}> = [];
    for (const rule of topRules) {
        ruleSeries.push({
            rule,
            counts: history.map((h) => h.aggregates.byRule.get(rule) ?? 0),
        });
    }
    return {labels, total, ruleSeries, ui: buildChartUiPayload()};
};

const renderHtml = (opts: {
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
}): string => {
    const chartBundles =
        opts.chartPayload && opts.chartScriptSrc
            ? `<script type="application/json" id="eslint-report-data">${JSON.stringify(opts.chartPayload)}</script>
  <script src="${escapeHtml(opts.chartScriptSrc)}"></script>`
            : '';
    const ruleRowsHtml = opts.ruleRows.map(([rule, n]) => `<tr><td>${escapeHtml(rule)}</td><td class="num">${n}</td></tr>`).join('\n');
    const fileRowsHtml = opts.fileRows.map(([file, n]) => `<tr><td class="path">${escapeHtml(file)}</td><td class="num">${n}</td></tr>`).join('\n');

    /** Inline SVG so favicon works when opening the report via file:// (no extra asset files). */
    const faviconHref = `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${REPORT_THEME.chartSurface}"/><rect x="6.5" y="17" width="5" height="9" rx="1.25" fill="${REPORT_THEME.accent}"/><rect x="13.5" y="11" width="5" height="15" rx="1.25" fill="${REPORT_THEME.accent}" opacity="0.92"/><rect x="20.5" y="6" width="5" height="20" rx="1.25" fill="${REPORT_THEME.accent}" opacity="0.82"/></svg>`,
    )}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="theme-color" content="${REPORT_THEME.appBG}"/>
  <link rel="icon" href="${faviconHref}" type="image/svg+xml" sizes="any"/>
  <title>ESLint seatbelt baseline</title>
  <style>
    :root {
      color-scheme: dark;
      line-height: 1.45;
      font-family: ${REPORT_BODY_FONT};
      background: ${REPORT_THEME.appBG};
      color: ${REPORT_THEME.text};
    }
    body {
      margin: 0 auto;
      max-width: 1200px;
      padding: 1rem 1.5rem 3rem;
      background: ${REPORT_THEME.appBG};
      color: ${REPORT_THEME.text};
    }
    h1 {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
      color: ${REPORT_THEME.heading};
      font-weight: 600;
    }
    h2 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: ${REPORT_THEME.heading};
      font-weight: 600;
    }
    .muted { color: ${REPORT_THEME.textSupporting}; font-size: 0.9rem; }
    code {
      font-family: ${REPORT_MONO_FONT};
      background: ${REPORT_THEME.codeBG};
      padding: 0.12rem 0.4rem;
      border-radius: 4px;
      font-size: 0.88em;
      color: ${REPORT_THEME.text};
    }
    .summary {
      margin: 1rem 0 1.5rem;
      padding: 0.75rem 1rem;
      background: ${REPORT_THEME.cardBG};
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 8px;
    }
    .summary dl { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; margin: 0; }
    .summary dt { font-weight: 600; color: ${REPORT_THEME.textSupporting}; }
    .summary dd { margin: 0; color: ${REPORT_THEME.text}; }
    section { margin-bottom: 2rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: ${REPORT_THEME.cardBG};
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 8px;
      overflow: hidden;
      font-size: 0.9rem;
    }
    th, td {
      padding: 0.45rem 0.65rem;
      text-align: left;
      border-bottom: 1px solid ${REPORT_THEME.borderRow};
    }
    th {
      background: ${REPORT_THEME.tableHeaderBG};
      cursor: pointer;
      user-select: none;
      color: ${REPORT_THEME.text};
      font-weight: 600;
    }
    th:hover { background: ${REPORT_THEME.tableHeaderHoverBG}; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.path {
      word-break: break-all;
      font-size: 0.82rem;
      font-family: ${REPORT_MONO_FONT};
      color: ${REPORT_THEME.textSupporting};
    }
    .chart-wrap {
      position: relative;
      height: 380px;
      background: ${REPORT_THEME.chartSurface};
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 8px;
      padding: 0.5rem;
    }
    .chart-controls {
      margin: 0.5rem 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem 1rem;
      align-items: center;
      font-size: 0.88rem;
      color: ${REPORT_THEME.text};
    }
    .chart-controls label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
    }
    .chart-controls input[type="checkbox"] { accent-color: ${REPORT_THEME.accent}; }
    footer {
      margin-top: 2rem;
      font-size: 0.85rem;
      color: ${REPORT_THEME.textSupporting};
      border-top: 1px solid ${REPORT_THEME.footerBorder};
      padding-top: 1rem;
    }
    footer a.footer-link { color: ${REPORT_THEME.link}; }
    footer a.footer-link:hover { text-decoration: underline; }
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
    <h2>History (${opts.chartPayload?.labels.length ?? 0} commits)</h2>
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
            ? `<p>Chart.js is saved beside this report as <code>${escapeHtml(CHART_BUNDLE_FILENAME)}</code> (<a class="footer-link" href="${escapeHtml(
                  CHART_JS_CDN,
              )}" target="_blank" rel="noopener noreferrer">pinned bundle</a>) so opening via <code>file://</code> still loads the chart.</p>`
            : ''
    }
    <p class="muted">Rule/file tables sort via the inline script below.</p>
  </footer>

  ${chartBundles}
  <script>
(() => {
  const dataEl = document.getElementById('eslint-report-data');
  const payload = dataEl ? JSON.parse(dataEl.textContent || 'null') : null;

  const sortTable = (tableId, colIndex, numeric) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = [...tbody.querySelectorAll('tr')];
    rows.sort((a, b) => {
      const ca = a.cells[colIndex].textContent.trim();
      const cb = b.cells[colIndex].textContent.trim();
      if (numeric) {
        return Number(cb) - Number(ca);
      }
      return ca.localeCompare(cb);
    });
    for (const row of rows) {
      tbody.appendChild(row);
    }
  };

  const wireSortHeaders = (selector, tableId) => {
    const ths = [...document.querySelectorAll(selector)];
    for (let i = 0; i < ths.length; i++) {
      const th = ths[i];
      th.addEventListener('click', () => {
        sortTable(tableId, i, th.dataset.sort === 'num');
      });
    }
  };
  wireSortHeaders('#table-rules thead th', 'table-rules');
  wireSortHeaders('#table-files thead th', 'table-files');

  if (!payload || !payload.ui || typeof Chart === 'undefined') {
    return;
  }

  const ui = payload.ui;
  const labels = payload.labels;
  const datasets = [{
    label: 'Total',
    data: payload.total,
    borderColor: ui.totalLine,
    backgroundColor: ui.totalFill,
    tension: 0.15,
    fill: true,
    borderWidth: 2,
    pointRadius: 2,
  }];

  const palette = ui.rulePalette || [];
  const ruleSeriesList = payload.ruleSeries || [];
  for (const [idx, rs] of ruleSeriesList.entries()) {
    const c = palette.length ? palette[idx % palette.length] : ui.totalLine;
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
  }

  const toggleRoot = document.getElementById('chart-toggles');

  const ctx = document.getElementById('history-chart');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: ui.legend },
        },
        tooltip: {
          enabled: true,
          backgroundColor: ui.tooltipBg,
          borderColor: ui.tooltipBorder,
          borderWidth: 1,
          titleColor: ui.tooltipText,
          bodyColor: ui.tooltipText,
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 45, minRotation: 0, color: ui.tick },
          grid: { color: ui.grid },
        },
        y: {
          beginAtZero: true,
          ticks: { color: ui.tick },
          grid: { color: ui.grid },
        },
      },
    },
  });

  if (toggleRoot) {
    for (let i = 0; i < datasets.length; i++) {
      const ds = datasets[i];
      const lab = document.createElement('label');
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.id = 'eslint-seatbelt-ds-' + i;
      inp.checked = ds.hidden !== true;
      inp.dataset.index = String(i);
      const span = document.createElement('span');
      span.textContent = ds.label;
      lab.appendChild(inp);
      lab.appendChild(span);
      toggleRoot.appendChild(lab);
    }
    const checkboxInputs = toggleRoot.querySelectorAll('input[type="checkbox"]');
    for (const inp of checkboxInputs) {
      inp.addEventListener('change', () => {
        const idx = Number(inp.dataset.index);
        chart.setDatasetVisibility(idx, inp.checked);
        chart.update();
      });
    }
  }
})();
  </script>
</body>
</html>`;
};

/**
 * Open an HTML file with the OS default handler (typically your default browser).
 */
const openHtmlReport = (absPath: string): void => {
    const absolute = path.resolve(absPath);
    if (process.platform === 'darwin') {
        spawnSync('open', [absolute], {stdio: 'ignore'});
    } else if (process.platform === 'win32') {
        // `start "" <path>` uses the empty window title so paths with spaces work.
        spawnSync('cmd', ['/c', 'start', '', absolute], {stdio: 'ignore', windowsHide: true});
    } else {
        spawnSync('xdg-open', [absolute], {stdio: 'ignore'});
    }
};

const parsePositiveIntArg = (val: string): number => {
    const n = Number.parseInt(val, 10);
    if (!Number.isFinite(n) || n < 1) {
        throw new Error('Must be a positive integer');
    }
    return n;
};

const parseNonNegativeIntArg = (val: string): number => {
    const n = Number.parseInt(val, 10);
    if (!Number.isFinite(n) || n < 0) {
        throw new Error('Must be a non-negative integer');
    }
    return n;
};

const runReport = async (): Promise<void> => {
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
                parse: parsePositiveIntArg,
            },
            'top-rules': {
                description: 'Top N rules for optional trend lines',
                default: 10,
                parse: parseNonNegativeIntArg,
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

    const topRuleNames = ruleRows.slice(0, topRules).map(([name]) => name);
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
    console.log(`eslint-report: wrote ${outAbs}`);

    const shouldOpen = openReport && !process.env.CI;
    if (shouldOpen) {
        try {
            openHtmlReport(outAbs);
        } catch {
            console.warn('eslint-report: could not open report in browser (display unavailable?)');
        }
    }
};

const main = async (): Promise<void> => {
    try {
        await runReport();
    } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
};

main().catch(() => {
    process.exit(1);
});
