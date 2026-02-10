---
ruleId: PERF-5
title: Use shallow comparisons instead of deep comparisons
searchPatterns:
  - "React.memo"
  - "deepEqual"
---

## [PERF-5] Use shallow comparisons instead of deep comparisons

### Reasoning

Deep equality checks recursively compare all nested properties, creating performance overhead that often exceeds the re-render cost they aim to prevent. Shallow comparisons of specific relevant properties provide the same optimization benefits with minimal computational cost.

### Incorrect

```tsx
memo(ReportActionItem, (prevProps, nextProps) =>
    deepEqual(prevProps.report, nextProps.report) &&
    prevProps.isSelected === nextProps.isSelected
)
```

### Correct

```tsx
memo(ReportActionItem, (prevProps, nextProps) =>
    prevProps.report.type === nextProps.report.type &&
    prevProps.report.reportID === nextProps.report.reportID &&
    prevProps.isSelected === nextProps.isSelected
)
```

---

### Review Metadata

In `React.memo` and similar optimization functions, compare only specific relevant properties instead of using deep equality checks.
