import Log from '@libs/Log';
import {DYNAMIC_ROUTES} from '@src/ROUTES';
import compileDynamicRoutePattern from './compileDynamicRoutePattern';

// Compile all DYNAMIC_ROUTES entries once at module load.
const allCompiled = Object.entries(DYNAMIC_ROUTES).map(([key, entry]) => ({key, compiled: compileDynamicRoutePattern(entry.path)}));

// Parametric entries have ':' placeholders and are used for runtime suffix matching.
const compiledParametricEntries = allCompiled.filter(({compiled}) => compiled.paramNames.length > 0);

const PARAM_PLACEHOLDER = '__param__';

/**
 * Generates every possible concrete URL form a pattern can produce by enumerating presence/absence
 * combinations of its optional segments. `:param` segments are filled with PARAM_PLACEHOLDER,
 * static segments are kept as-is.
 *
 * For each form we return the candidate string WITH a trailing slash (the format expected by the
 * compiled regex's `^...$` anchor).
 *
 * @private - Internal helper. Do not export or use outside this file.
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

    // Calculate the total number of possible combinations of optional segments.
    // eslint-disable-next-line no-bitwise
    const total = 1 << optionalIndices.length;
    const samples: string[] = [];
    for (let mask = 0; mask < total; mask++) {
        const parts: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments.at(i) ?? '';
            const optionalSlot = optionalIndices.indexOf(i);
            if (optionalSlot !== -1) {
                // Check if the optional segment is present in the current combination.
                // eslint-disable-next-line no-bitwise
                const present = (mask & (1 << optionalSlot)) !== 0;
                if (!present) {
                    // If the optional segment is not present, skip it.
                    continue;
                }
                parts.push(PARAM_PLACEHOLDER);
                continue;
            }
            // If the segment is a parameter, replace it with the parameter placeholder.
            if (segment.startsWith(':')) {
                parts.push(PARAM_PLACEHOLDER);
                continue;
            }
            // If the segment is a static segment, add it to the parts.
            parts.push(segment);
        }
        // Add a trailing slash to the parts and push the sample to the samples array.
        samples.push(`${parts.join('/')}/`);
    }
    // Return the samples.
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
 * In dev/test: throws. In production: logs via `Log.alert`.
 */
function validateDynamicRoutes(): void {
    const conflicts: string[] = [];

    for (const a of allCompiled) {
        const samples = generateSampleForms(a.compiled.pattern);
        for (const b of allCompiled) {
            if (a.key === b.key) {
                continue;
            }
            if (a.compiled.maxSegments < b.compiled.minSegments || a.compiled.minSegments > b.compiled.maxSegments) {
                continue;
            }
            for (const sample of samples) {
                if (b.compiled.regex.test(sample)) {
                    const sampleWithoutTrailingSlash = sample.replaceAll(/\/$/g, '');
                    conflicts.push(
                        `Dynamic route "${a.key}" (path: "${a.compiled.pattern}") with form "${sampleWithoutTrailingSlash}" shadows route "${b.key}" (path: "${b.compiled.pattern}")`,
                    );
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

// Detect shadow conflicts at module load.
validateDynamicRoutes();

export {compiledParametricEntries};
export default validateDynamicRoutes;
