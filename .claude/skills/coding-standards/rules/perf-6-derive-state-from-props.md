---
ruleId: PERF-6
title: Derive state from props
searchPatterns:
  - "useEffect"
  - "useState"
---

## [PERF-6] Derive state from props

### Reasoning

Computing derived values directly in the component body ensures they're always synchronized with props/state and avoids unnecessary re-renders.

### Incorrect

```tsx
function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);
}
```

### Correct

```tsx
function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // Good: calculated during rendering
  const fullName = firstName + ' ' + lastName;
}
```

---

### Review Metadata

Flag when useEffect updates state based on props or other state, when the value could be computed directly.
