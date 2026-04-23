/**
 * Compiles a dynamic-route pattern (e.g. `'flag/:reportID/:reportActionID?'`) into a runtime
 * representation that can be matched against URL path candidates.
 *
 * Supports three segment kinds:
 *   - static literal segment (e.g. `'flag'`)
 *   - required path param (e.g. `':reportID'`)
 *   - optional path param (e.g. `':reportActionID?'`)
 *
 * The resulting regex mirrors how `@react-navigation/core`'s `getStateFromPath` builds patterns:
 * each segment contributes `<literal>\/` or `(?<name>[^/]+)\/`, with optional segments wrapped
 * in `(?:...)?`. The candidate string MUST be normalized with a trailing `/` before matching.
 */

type CompiledPattern = {
    /** Original pattern string, e.g. `'a/:p?/b'`. */
    pattern: string;

    /** Compiled regex anchored to `^...$`; consumers must append a trailing `/` to the candidate before exec. */
    regex: RegExp;

    /** Names of all `:param` and `:param?` placeholders in declaration order. */
    paramNames: string[];

    /** Minimum number of URL segments that can satisfy this pattern (all optionals absent). */
    minSegments: number;

    /** Maximum number of URL segments that can satisfy this pattern (all optionals present). */
    maxSegments: number;
};

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(input: string): string {
    return input.replace(REGEX_SPECIAL_CHARS, '\\$&');
}

function compileDynamicRoutePattern(pattern: string): CompiledPattern {
    if (!pattern) {
        throw new Error(`[compileDynamicRoutePattern] Pattern must be a non-empty string, got "${pattern}"`);
    }

    const segments = pattern.split('/');

    // A pattern like 'a/' would produce an empty trailing segment - reject it for a clearer error.
    if (segments.some((s, i) => s === '' && i !== segments.length - 1)) {
        throw new Error(`[compileDynamicRoutePattern] Pattern "${pattern}" contains an empty segment`);
    }

    const paramNames: string[] = [];
    const seenParamNames = new Set<string>();
    let minSegments = 0;
    let maxSegments = 0;
    let regexBody = '';

    for (const segment of segments) {
        if (segment === '') {
            // Trailing empty segment due to a trailing slash - tolerate by skipping.
            continue;
        }

        if (segment.startsWith(':')) {
            const optional = segment.endsWith('?');
            const name = optional ? segment.slice(1, -1) : segment.slice(1);

            if (!name || name.includes(':')) {
                throw new Error(`[compileDynamicRoutePattern] Pattern "${pattern}" contains a malformed param "${segment}"`);
            }
            if (seenParamNames.has(name)) {
                throw new Error(`[compileDynamicRoutePattern] Pattern "${pattern}" declares duplicate param "${name}"`);
            }
            seenParamNames.add(name);
            paramNames.push(name);

            if (optional) {
                regexBody += `(?:(?<${name}>[^/]+)\\/)?`;
                maxSegments += 1;
            } else {
                regexBody += `(?<${name}>[^/]+)\\/`;
                minSegments += 1;
                maxSegments += 1;
            }
        } else {
            regexBody += `${escapeRegex(segment)}\\/`;
            minSegments += 1;
            maxSegments += 1;
        }
    }

    if (paramNames.length === 0 && minSegments === 0) {
        throw new Error(`[compileDynamicRoutePattern] Pattern "${pattern}" has no segments`);
    }

    const regex = new RegExp(`^${regexBody}$`);
    return {pattern, regex, paramNames, minSegments, maxSegments};
}

export default compileDynamicRoutePattern;
export type {CompiledPattern};
