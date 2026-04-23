import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type {DynamicRouteSuffix} from '@src/ROUTES';
import compileDynamicRoutePattern from './compileDynamicRoutePattern';
import type {CompiledPattern} from './compileDynamicRoutePattern';
import validateDynamicRoutes from './validateDynamicRoutes';

const dynamicRouteEntries = Object.values(DYNAMIC_ROUTES);

// A Set of all dynamic-route paths (literal pattern strings, e.g. 'country', 'flag/:reportID/:reportActionID').
// Serves a dual purpose:
//   1. O(1) static-suffix fast-path lookup in `isDynamicRouteSuffix`.
//   2. `isDynamicRouteScreen` checks a screen's normalizedConfigs path against this Set.
const dynamicRoutePaths = new Set<string>(dynamicRouteEntries.map((r) => r.path));

type DynamicRouteEntry = (typeof DYNAMIC_ROUTES)[keyof typeof DYNAMIC_ROUTES];

type CompiledParametricEntry = {
    entry: DynamicRouteEntry;
    compiled: CompiledPattern;
};

// Parametric entries are dynamic routes whose path contains ':' placeholders
// (e.g. 'flag/:reportID/:reportActionID' or 'opt-page/:id?').
// Precompile once at module load so that runtime matching is just a regex exec per candidate.
const compiledParametricEntries: CompiledParametricEntry[] = dynamicRouteEntries
    .filter((entry) => entry.path.includes(':'))
    .map((entry) => ({entry, compiled: compileDynamicRoutePattern(entry.path)}));

// Detect shadow conflicts at module load. In dev/test this throws; in production it logs only.
validateDynamicRoutes(DYNAMIC_ROUTES as Record<string, {path: string}>);

/**
 * Checks if a suffix matches any dynamic route path in DYNAMIC_ROUTES.
 * Supports both exact static matches and parametric pattern matches (including optional path params).
 *
 * @param suffix - The suffix to check
 * @returns True if the suffix matches any dynamic route path, false otherwise
 */
function isDynamicRouteSuffix(suffix: string): suffix is DynamicRouteSuffix {
    if (!suffix) {
        return false;
    }

    if (dynamicRoutePaths.has(suffix)) {
        return true;
    }

    const segmentCount = suffix.split('/').filter(Boolean).length;
    const normalizedSuffix = `${suffix}/`;

    for (const {compiled} of compiledParametricEntries) {
        if (segmentCount < compiled.minSegments || segmentCount > compiled.maxSegments) {
            continue;
        }
        if (compiled.regex.test(normalizedSuffix)) {
            return true;
        }
    }

    return false;
}

export {dynamicRoutePaths, compiledParametricEntries};
export type {CompiledParametricEntry};
export default isDynamicRouteSuffix;
