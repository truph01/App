# Cluster 17: Files Validation (2 usages)

## Strategy

**ConfirmModal pattern (ref + afterTransition)**

User confirms an action via a modal, then selections are cleared after the modal closes. Use a ConfirmModal ref with `afterTransition` to defer the cleanup.

## Usages

| File                     | Line | Current                                      | Migration                                          | PR                                                    |
| ------------------------ | ---- | -------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `useFilesValidation.tsx` | 108  | InteractionManager deferring file validation | Use ConfirmModal ref approach with afterTransition | [#65316](https://github.com/Expensify/App/pull/65316) |
| `useFilesValidation.tsx` | 365  | InteractionManager deferring file validation | Use ConfirmModal ref approach with afterTransition | [#65316](https://github.com/Expensify/App/pull/65316) |
