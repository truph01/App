---
ruleId: PERF-7
title: Control component resets via key prop
category: perf
impact: MEDIUM
tags: key, useEffect, reset, state
searchPatterns:
  - "useEffect"
  - "useState"
---

## [PERF-7] Control component resets via key prop

### Reasoning

Using `key` prop for full resets is more React-idiomatic. When a prop changes and you need to reset all component state, the `key` prop causes React to unmount and remount the component, automatically resetting all state without needing useEffect.

### Incorrect

```tsx
function ProfilePage({ userId }) {
  return <ProfileView userId={userId} />;
}

function ProfileView({ userId }) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setComment(''); // Reset when userId changes
    setRating(0);
  }, [userId]);
}
```

### Correct

```tsx
function ProfilePage({ userId }) {
  return <ProfileView key={userId} userId={userId} />;
}

function ProfileView({ userId }) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  // Component resets when userId changes due to key prop
}
```

---

### Review Metadata

- Flag when useEffect resets all or most component state when a prop changes
- Should use `key` prop instead to reset the entire component
