import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type {DynamicRouteSuffix} from '@src/ROUTES';
import {compiledParametricEntries} from './validateDynamicRoutes';

// A Set of all static dynamic-route paths (e.g. 'country', 'verify-account') for O(1) lookups.
const dynamicRoutePaths = new Set<string>(Object.values(DYNAMIC_ROUTES).map((r) => r.path));

/**
 * Checks if a suffix matches any dynamic route path in DYNAMIC_ROUTES.
 * Supports both exact static matches and parametric pattern matches (including optional path params).
 *
 * @param suffix - The suffix to check
 * @returns True if the suffix matches any dynamic route path, false otherwise
 */
function isDynamicRouteSuffix(suffix: string): suffix is DynamicRouteSuffix {
    // Exact static match
    if (dynamicRoutePaths.has(suffix)) {
        return true;
    }

    // Parametric pattern match
    const segmentCount = suffix.split('/').filter(Boolean).length;
    // Append trailing '/' because compiled regexes expect each segment to end with '/'.
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

export {dynamicRoutePaths};
export default isDynamicRouteSuffix;
