import compileDynamicRoutePattern from './compileDynamicRoutePattern';
import type {CompiledPattern} from './compileDynamicRoutePattern';

type PatternMatch = {
    params: Record<string, string>;
};

// Memoize compiled patterns to avoid rebuilding regex on every match call.
// Patterns come from a small, finite set (DYNAMIC_ROUTES.path values), so the cache stays bounded.
const compileCache = new Map<string, CompiledPattern>();

function getCompiled(pattern: string): CompiledPattern {
    const cached = compileCache.get(pattern);
    if (cached) {
        return cached;
    }
    const compiled = compileDynamicRoutePattern(pattern);
    compileCache.set(pattern, compiled);
    return compiled;
}

/**
 * Matches a URL path candidate against a route pattern with `:param` and `:param?` placeholders.
 *
 * Static segments must match exactly; required `:param` segments capture any non-empty value;
 * optional `:param?` segments may be absent (no key in params) or present (key with value).
 *
 * @param candidate - The actual URL suffix, e.g. 'flag/123/abc'
 * @param pattern - The registered pattern, e.g. 'flag/:reportID/:reportActionID?'
 * @returns Match result with extracted params, or undefined if no match
 */
function matchPathPattern(candidate: string, pattern: string): PatternMatch | undefined {
    // Special case: empty pattern matches only an empty (or slash-only) candidate.
    if (pattern === '') {
        const trimmedCandidate = candidate.replace(/^\/+|\/+$/g, '');
        return trimmedCandidate === '' ? {params: {}} : undefined;
    }

    const compiled = getCompiled(pattern);

    // Normalize the candidate: strip leading slashes, ensure exactly one trailing slash to satisfy
    // the regex's `^...$` anchor (each compiled segment ends with `\/`).
    const trimmed = candidate.replace(/^\/+/, '').replace(/\/+$/, '');
    if (trimmed === '') {
        // Only patterns with all-optional segments could conceivably match an empty candidate;
        // in practice DYNAMIC_ROUTES never registers such a pattern, but handle defensively.
        return compiled.minSegments === 0 ? {params: {}} : undefined;
    }
    const normalized = `${trimmed}/`;

    const m = compiled.regex.exec(normalized);
    if (!m) {
        return undefined;
    }

    const params: Record<string, string> = {};
    for (const name of compiled.paramNames) {
        const value = m.groups?.[name];
        if (value === undefined) {
            continue;
        }
        try {
            params[name] = decodeURIComponent(value);
        } catch {
            return undefined;
        }
    }
    return {params};
}

export default matchPathPattern;
export type {PatternMatch};
