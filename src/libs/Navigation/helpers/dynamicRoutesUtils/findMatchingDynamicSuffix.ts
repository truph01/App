import {compiledParametricEntries, dynamicRoutePaths} from './isDynamicRouteSuffix';
import splitPathAndQuery from './splitPathAndQuery';

type DynamicSuffixMatch = {
    /** Registered pattern, e.g. 'flag/:reportID/:reportActionID' or 'opt-page/:id?' */
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
 * "Longest first" guarantees that nested suffixes never accidentally truncate to a shorter
 * interpretation when a longer one is valid.
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

    for (let i = 0; i < segments.length; i++) {
        const candidate = segments.slice(i).join('/');

        if (dynamicRoutePaths.has(candidate)) {
            return {pattern: candidate, actualSuffix: candidate, pathParams: {}};
        }

        const candidateSegmentCount = segments.length - i;
        const normalized = `${candidate}/`;

        for (const {compiled} of compiledParametricEntries) {
            if (candidateSegmentCount < compiled.minSegments || candidateSegmentCount > compiled.maxSegments) {
                continue;
            }
            const m = compiled.regex.exec(normalized);
            if (!m) {
                continue;
            }
            const pathParams: Record<string, string> = {};
            for (const name of compiled.paramNames) {
                const value = m.groups?.[name];
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
