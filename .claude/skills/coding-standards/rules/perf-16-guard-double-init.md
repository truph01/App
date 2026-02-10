---
ruleId: PERF-16
title: Guard initialization logic against double-execution
searchPatterns:
  - "useEffect"
  - "\\[\\]"
---

## [PERF-16] Guard initialization logic against double-execution

### Reasoning

React Strict Mode [intentionally double-invokes Effects](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application) in development to surface missing cleanup. Non-idempotent initialization — whether app-wide (auth tokens, global config) or per-feature (SDK setup, analytics session creation, deep link handler registration) — can break when executed twice. Guarding with a module-level flag or moving initialization outside the component ensures it runs exactly once regardless of rendering mode.

### Incorrect

```tsx
function App() {
    useEffect(() => {
        loadDataFromLocalStorage();
        checkAuthToken();
    }, []);
}
```

### Correct (module-level guard)

```tsx
let didInit = false;

function App() {
    useEffect(() => {
        if (didInit) {
            return;
        }
        didInit = true;

        loadDataFromLocalStorage();
        checkAuthToken();
    }, []);
}
```

### Correct (module-level execution)

```tsx
if (typeof window !== 'undefined') {
    checkAuthToken();
    loadDataFromLocalStorage();
}

function App() {
    // ...
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- A `useEffect` with empty dependency array `[]` runs non-idempotent initialization logic
- The logic would cause problems if executed twice (e.g., double API calls, invalidated tokens, duplicate SDK init, duplicate analytics sessions, duplicate deep link registrations)
- There is no guard mechanism (module-level flag or module-level execution)
- This applies at any level — app-wide init, feature screens, or individual components

**DO NOT flag if:**

- A module-level guard variable prevents double execution (`if (didInit) return`)
- The logic is idempotent (safe to run twice with no side effects)
- The logic is at module level, outside any component
- The Effect has non-empty dependencies (not one-time init)
