---
ruleId: PERF-15
title: Clean up async Effects to prevent race conditions
searchPatterns:
  - "useEffect"
  - "fetch\\("
  - "async"
  - "await"
  - "\\.then\\("
  - "setState"
  - "eslint-disable"
---

## [PERF-15] Clean up async Effects to prevent race conditions

### Reasoning

When an Effect's dependencies change, the previous async operation [may still be in flight](https://react.dev/learn/you-might-not-need-an-effect#fetching-data). Without cleanup, a slow earlier response can overwrite the result of a faster later response, showing stale data. This is especially dangerous for search inputs and navigation where dependencies change rapidly.

### Incorrect

```tsx
useEffect(() => {
    fetchResults(query).then((json) => {
        setResults(json);
    });
}, [query]);
```

### Correct (ignore flag)

```tsx
useEffect(() => {
    let ignore = false;

    fetchResults(query).then((json) => {
        if (!ignore) {
            setResults(json);
        }
    });

    return () => {
        ignore = true;
    };
}, [query]);
```

### Correct (AbortController)

```tsx
useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, {signal: controller.signal})
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch((e) => {
            if (e.name !== 'AbortError') {
                setError(e);
            }
        });

    return () => controller.abort();
}, [query]);
```

---

### Review Metadata

Flag when EITHER of these is true:

**Case 1 — Missing cleanup:**
- A `useEffect` performs async work (fetch, promise chain, async/await)
- The async result is written to state via `setState`
- There is no cleanup mechanism to discard stale responses (no `ignore` flag, no `AbortController`, no cancellation token)

**Case 2 — Suppressed dependency lint:**
- A `useEffect` performs async work and sets state
- The dependency array has an `eslint-disable` comment suppressing `react-hooks/exhaustive-deps`
- This hides a dependency that could change and cause a race condition

**DO NOT flag if:**

- The Effect includes an `ignore`/`cancelled` boolean checked before `setState`
- The Effect uses `AbortController` to cancel the request on cleanup
- The dependency array is empty `[]` with no suppressed lint (no race possible — deps never change)
- The async operation doesn't set state (fire-and-forget)
- Data fetching is handled by a library/framework (e.g., Onyx, React Query)
