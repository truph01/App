import Log from '@libs/Log';
import compileDynamicRoutePattern from './compileDynamicRoutePattern';
import type {CompiledPattern} from './compileDynamicRoutePattern';

type DynamicRouteEntries = Record<string, {path: string}>;

const OPT_PLACEHOLDER = '__opt__';

/**
 * Generates every possible concrete URL form a pattern can produce by enumerating presence/absence
 * combinations of its optional segments. Required `:param` segments are filled with `__opt__`,
 * static segments are kept as-is.
 *
 * For each form we return the candidate string WITH a trailing slash (the format expected by the
 * compiled regex's `^...$` anchor).
 */
function generateSampleForms(pattern: string): string[] {
    const segments = pattern.split('/').filter(Boolean);

    // Identify indices of optional segments (those ending with '?').
    const optionalIndices: number[] = [];
    for (let i = 0; i < segments.length; i++) {
        const segment = segments.at(i);
        if (segment?.startsWith(':') && segment.endsWith('?')) {
            optionalIndices.push(i);
        }
    }

    const total = 1 << optionalIndices.length;
    const samples: string[] = [];
    for (let mask = 0; mask < total; mask++) {
        const parts: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments.at(i) ?? '';
            const optionalSlot = optionalIndices.indexOf(i);
            if (optionalSlot !== -1) {
                const present = (mask & (1 << optionalSlot)) !== 0;
                if (!present) {
                    continue;
                }
                parts.push(OPT_PLACEHOLDER);
                continue;
            }
            if (segment.startsWith(':')) {
                parts.push(OPT_PLACEHOLDER);
                continue;
            }
            parts.push(segment);
        }
        samples.push(`${parts.join('/')}/`);
    }
    return samples;
}

/**
 * Validates that no two registered dynamic-route patterns can match the same concrete URL.
 *
 * For each ordered pair (A, B) where A ≠ B we enumerate every concrete URL that A can produce
 * (across all optional-segment presence combinations) and test it against B's compiled regex.
 * If any such candidate matches B, it means a real URL targeting A would be silently routed
 * to B (or vice versa) - a shadow conflict.
 *
 * Behavior on conflict:
 *   - In dev/test (`NODE_ENV !== 'production'`): throws with all conflicts joined.
 *   - In production: emits a single `Log.alert` so the app keeps working.
 */
function validateDynamicRoutes(entries: DynamicRouteEntries): void {
    const compiled: Array<{key: string; compiled: CompiledPattern}> = [];

    for (const [key, entry] of Object.entries(entries)) {
        compiled.push({key, compiled: compileDynamicRoutePattern(entry.path)});
    }

    const conflicts: string[] = [];

    for (const a of compiled) {
        const samples = generateSampleForms(a.compiled.pattern);
        for (const b of compiled) {
            if (a.key === b.key) {
                continue;
            }
            for (const sample of samples) {
                if (b.compiled.regex.test(sample)) {
                    const sampleWithoutTrailingSlash = sample.replace(/\/$/, '');
                    conflicts.push(`Dynamic route "${a.key}" (path: "${a.compiled.pattern}") with form "${sampleWithoutTrailingSlash}" shadows route "${b.key}" (path: "${b.compiled.pattern}")`);
                    break;
                }
            }
        }
    }

    if (conflicts.length === 0) {
        return;
    }

    const message = `[validateDynamicRoutes] Detected ${conflicts.length} shadow conflict(s) between DYNAMIC_ROUTES entries:\n${conflicts.join('\n')}`;

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(message);
    }

    Log.alert('[DynamicRoutes] Shadow conflicts detected', {messages: conflicts});
}

export default validateDynamicRoutes;
export type {DynamicRouteEntries};
