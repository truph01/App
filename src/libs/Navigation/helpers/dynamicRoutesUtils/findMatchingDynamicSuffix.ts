import {dynamicRoutePaths} from './isDynamicRouteSuffix';
import splitPathAndQuery from './splitPathAndQuery';
import {compiledParametricEntries} from './validateDynamicRoutes';

type DynamicSuffixMatch = {
    /** Registered pattern, e.g. 'flag/:reportID/:reportActionID' or 'page/:id?' */
    pattern: string;
    /** Actual URL values, e.g. 'flag/456/abc' or 'opt-page' (when optional is absent) */
    actualSuffix: string;
    /** Extracted path params, e.g. {reportID: '456', reportActionID: 'abc'} */
    pathParams: Record<string, string>;
};

/**
 * Finds a registered dynamic route suffix that matches the end of the given path.
 *
 * Iterates path sub-suffixes from longest to shortest and checks each against registered
 * dynamic paths. At each candidate length:
 *   1. Static match is tried first (`dynamicRoutePaths` Set lookup).
 *   2. Parametric patterns are tried in registration order, but pre-filtered by their
 *      `[minSegments, maxSegments]` range so only relevant ones run regex.
 *
 * Longer candidates are tried first to prefer the most specific match.
 *
 * @param path - The path to find the matching dynamic suffix for
 * @returns The matching dynamic suffix, or undefined if no matching suffix is found
 */
function findMatchingDynamicSuffix(path = ''): DynamicSuffixMatch | undefined {
    const [normalizedPath] = splitPathAndQuery(path);
    if (!normalizedPath) {
        return undefined;
    }

    const segments = normalizedPath.split('/').filter(Boolean);

    // Iterate from the full path (longest candidate) down to single-segment suffixes.
    // This guarantees the longest matching suffix is returned first.
    for (let i = 0; i < segments.length; i++) {
        const candidate = segments.slice(i).join('/');

        // Static match (e.g. 'country', 'verify-account')
        if (dynamicRoutePaths.has(candidate)) {
            return {pattern: candidate, actualSuffix: candidate, pathParams: {}};
        }

        // Try parametric patterns (e.g. 'flag/:reportID/:reportActionID?') against the candidate.
        // Extract named path params from the match if found.
        const candidateSegmentCount = segments.length - i;
        // Append trailing '/' because compiled regexes expect each segment to end with '/'.
        const normalized = `${candidate}/`;

        for (const {compiled} of compiledParametricEntries) {
            if (candidateSegmentCount < compiled.minSegments || candidateSegmentCount > compiled.maxSegments) {
                continue;
            }
            const match = compiled.regex.exec(normalized);
            if (!match) {
                continue;
            }
            const pathParams: Record<string, string> = {};
            for (const name of compiled.paramNames) {
                const value = match.groups?.[name];
                if (value === undefined) {
                    continue;
                }
                try {
                    pathParams[name] = decodeURIComponent(value);
                } catch {
                    pathParams[name] = value;
                }
            }
            return {pattern: compiled.pattern, actualSuffix: candidate, pathParams};
        }
    }

    return undefined;
}

export default findMatchingDynamicSuffix;
export type {DynamicSuffixMatch};
