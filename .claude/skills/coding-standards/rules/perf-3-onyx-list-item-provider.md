---
ruleId: PERF-3
title: Use OnyxListItemProvider hooks instead of useOnyx in renderItem
category: perf
impact: HIGH
tags: useOnyx, renderItem, OnyxListItemProvider, subscriptions
searchPatterns:
  - "useOnyx"
  - "renderItem"
---

## [PERF-3] Use OnyxListItemProvider hooks instead of useOnyx in renderItem

### Reasoning

Individual `useOnyx` calls in renderItem create separate subscriptions for each list item, causing memory overhead and update cascades. `OnyxListItemProvider` hooks provide optimized data access patterns specifically designed for list rendering performance.

### Incorrect

```tsx
const [personalDetails] = useOnyx(ONYXKEYS.PERSONAL_DETAILS_LIST);
```

### Correct

```tsx
const personalDetails = usePersonalDetails();
```

---

### Review Metadata

Components rendered inside `renderItem` functions should use dedicated hooks from `OnyxListItemProvider` instead of individual `useOnyx` calls.
