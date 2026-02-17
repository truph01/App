# Cluster 14: Settings Pages (~4 usages)

## Strategy

**Mixed — Navigation afterTransition, KeyboardUtils.dismiss**

Settings pages combine navigation-dependent cleanup and keyboard dismissal patterns.

## Usages

| File                           | Line | Current                                  | Migration                                                                                                  | PR                                                    |
| ------------------------------ | ---- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `StatusPage.tsx`               | 136  | `clearDraftCustomStatus()` + navigate    | Remove navigateBackToPreviousScreenTask and use `Navigation.goBack({afterTransition: () => clearDraft()})` | [#40364](https://github.com/Expensify/App/pull/40364) |
| `StatusPage.tsx`               | 157  | Navigate back after status action        | Remove navigateBackToPreviousScreenTask and use `Navigation.goBack({afterTransition})`                     | [#40364](https://github.com/Expensify/App/pull/40364) |
| `ContactMethodDetailsPage.tsx` | 130  | Open delete modal after keyboard dismiss | `KeyboardUtils.dismiss({afterTransition: () => setIsDeleteModalOpen(true)})`                               | [#35305](https://github.com/Expensify/App/pull/35305) |
| `TwoFactorAuth/VerifyPage.tsx` | 79   | 2FA verify navigation                    | Investigate if InteractionManager is needed                                                                | [#67762](https://github.com/Expensify/App/pull/67762) |
