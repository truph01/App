---
ruleId: PERF-17
title: Keep useOnyx selector output small and simple
---

## [PERF-17] Keep useOnyx selector output small and simple

### Reasoning

When a `selector` is passed to `useOnyx`, every Onyx update triggers a `deepEqual` comparison between the previous and current selector output to decide whether to re-render the component. If the selector returns a large object, a full collection, or a non-plain type like `Set`/`Map`, this comparison becomes extremely expensive — often taking hundreds of milliseconds on large datasets. Without a selector, `useOnyx` uses a much cheaper `shallowEqual` on raw Onyx references.

Selectors should **narrow** data to the smallest possible output. Ideal selector outputs are primitives (`boolean`, `string`, `number`), small objects with a few fields, or short arrays. Returning entire collections, mapped/transformed collections, or intermediate data structures defeats the purpose of selectors and degrades performance.

**Key principles:**
1. **Selectors must reduce data, not just transform it.** A selector like `(data) => data?.reports` that extracts a large sub-property provides no reduction — it forces expensive `deepEqual` on the entire structure for no benefit.
2. **Prefer no selector when data is already in the right shape.** Without a selector, `useOnyx` uses `shallowEqual`, which is O(1) on stable references.
3. **Never return `Set` or `Map` from a selector.** `deepEqual` is extremely slow on these types. Compute them inline after the `useOnyx` call instead.
4. **Compute final scalars in selectors when possible.** If the component only needs a boolean or count, the selector should return that directly.
5. **Don't map entire collections inside a selector.** Mapping creates new object references every time, forcing `deepEqual` to compare every item. Subscribe without a selector and map inline instead.

### Incorrect

```tsx
// BAD: Selector returns a large mapped collection — deepEqual must compare every item
const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY, {
    selector: (policies) =>
        Object.fromEntries(
            Object.entries(policies ?? {}).map(([key, policy]) => [
                key,
                {id: policy?.id, name: policy?.name, type: policy?.type},
            ]),
        ),
});

// BAD: Selector extracts a large sub-property without narrowing
const [reportAttributes] = useOnyx(ONYXKEYS.DERIVED.REPORT_ATTRIBUTES, {
    selector: (data) => data?.reports,
});

// BAD: Selector filters/maps a collection into an array — deepEqual on every item
const [archivedReportIdsArray] = useOnyx(ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS, {
    selector: (data): string[] =>
        Object.entries(data ?? {})
            .filter(([, value]) => value?.isArchived)
            .map(([key]) => key),
});

// BAD: Selector returns a Set — deepEqual is extremely slow on Sets
const [archivedReportIds] = useOnyx(ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS, {
    selector: (data): Set<string> => {
        const ids = new Set<string>();
        Object.entries(data ?? {}).forEach(([key, value]) => {
            if (value?.isArchived) {
                ids.add(key);
            }
        });
        return ids;
    },
});

// BAD: Selector returns an array when the component only needs a boolean
const [reportSummaries] = useOnyx(ONYXKEYS.COLLECTION.REPORT, {
    selector: (reports) =>
        Object.values(reports ?? {}).filter((r) => r?.total === 0),
});
const hasEmptyReports = reportSummaries.length > 0;
```

### Correct

```tsx
// GOOD: No selector — useOnyx uses cheap shallowEqual, then transform inline
const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
const mappedPolicies = Object.fromEntries(
    Object.entries(policies ?? {}).map(([key, policy]) => [
        key,
        {id: policy?.id, name: policy?.name, type: policy?.type},
    ]),
);

// GOOD: No selector — access the property directly
const [reportAttributes] = useOnyx(ONYXKEYS.DERIVED.REPORT_ATTRIBUTES);
const reports = reportAttributes?.reports;

// GOOD: No selector — filter and compute Set inline
const [reportNameValuePairs] = useOnyx(ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS);
const archivedReportIds = new Set(
    Object.entries(reportNameValuePairs ?? {})
        .filter(([, value]) => value?.isArchived)
        .map(([key]) => key),
);

// GOOD: Selector computes the final boolean directly
const [hasEmptyReports] = useOnyx(ONYXKEYS.COLLECTION.REPORT, {
    selector: (reports) =>
        Object.values(reports ?? {}).some((r) => r?.total === 0),
});
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- Code uses `useOnyx` with a `selector` option
- The selector returns a large object, a full collection, a mapped/transformed collection, a `Set`, a `Map`, or an intermediate data structure that is further reduced by the component
- The output could be narrowed to a smaller type (primitive, small object) or the selector could be removed entirely

**DO NOT flag if:**

- The selector returns a primitive value (`boolean`, `string`, `number`, `undefined`)
- The selector returns a small object with only a few fields picked from a single item (not a collection)
- The selector meaningfully reduces a large dataset to a small result
- The `useOnyx` call is on a single-item key (not a collection), and the selector picks a few fields

**Search Patterns** (hints for reviewers):
- `useOnyx.*selector`
- `selector.*=>`
- `new Set\(`
- `new Map\(`
- `Object\.fromEntries`
- `Object\.entries.*\.map`
- `Object\.values.*\.filter`
- `\.map\(.*=>.*\{`
