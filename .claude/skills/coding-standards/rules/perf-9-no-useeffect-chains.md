---
ruleId: PERF-9
title: Avoid useEffect chains
category: perf
impact: HIGH
tags: useEffect, chain, derived-state, render-cascade
searchPatterns:
  - "useEffect"
  - "useState"
---

## [PERF-9] Avoid useEffect chains

### Reasoning

Chains of effects create complex dependencies, timing issues, and unnecessary renders. Logic should be restructured to avoid interdependent effects.

### Incorrect

```tsx
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Avoid: chain of effects
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  useEffect(() => {
    setIsValid(fullName.length > 0);
  }, [fullName]);
}
```

### Correct

```tsx
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Good: compute derived values directly
  const fullName = firstName + ' ' + lastName;
  const isValid = firstName.length > 0 && lastName.length > 0;

  return (
    <form>
      <input value={firstName} onChange={e => setFirstName(e.target.value)} />
      <input value={lastName} onChange={e => setLastName(e.target.value)} />
      {isValid && <button>Submit</button>}
    </form>
  );
}
```

---

### Review Metadata

Flag when multiple useEffects form a chain where one effect's state update triggers another effect.
