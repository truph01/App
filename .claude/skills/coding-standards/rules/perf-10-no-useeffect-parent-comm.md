---
ruleId: PERF-10
title: Communicate with parent components without useEffect
category: perf
impact: MEDIUM
tags: useEffect, parent-child, state-lifting, data-flow
searchPatterns:
  - "useEffect"
  - "onChange"
  - "onValueChange"
---

## [PERF-10] Communicate with parent components without useEffect

### Reasoning

Parent-child communication should not use useEffect. Instead, lift the state up to the parent component and pass it down as props. This follows React's unidirectional data flow pattern, eliminates synchronization issues, reduces unnecessary renders, and makes the data flow clearer. Use useEffect only when synchronizing with external systems, not for parent-child communication.

### Incorrect

```tsx
// Avoid: passing data via useEffect
function Child({ onValueChange }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    onValueChange(value);
  }, [value, onValueChange]);

  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

### Correct

```tsx
// Lifting state up
function Parent() {
  const [value, setValue] = useState('');
  return <Child value={value} onChange={setValue} />;
}

function Child({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
```

---

### Review Metadata

Flag when useEffect calls parent callbacks to communicate state changes or pass data to parent components.
