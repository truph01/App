# Cluster 18: Navigate After Focus (Skipped for now)

## Strategy

**Skip — address separately**

These usages involve `useFocusEffect` combined with navigation, which requires a different approach that hasn't been designed yet. They should be addressed in a separate effort.

## Usages

| File                      | Line         | Description                                              | PR                                                    |
| ------------------------- | ------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| `AccountDetailsPage.tsx`  | 87           | Navigate after `useFocusEffect` triggers                 | [#59911](https://github.com/Expensify/App/pull/59911) |
| `AccountDetailsPage.tsx`  | 116          | Navigate after `useFocusEffect` triggers                 | [#65834](https://github.com/Expensify/App/pull/65834) |
| `AccountValidatePage.tsx` | 128          | Navigate after `useFocusEffect` triggers                 | [#79597](https://github.com/Expensify/App/pull/79597) |
| `Report/index.ts`         | 5910         | `navigateToTrainingModal()` — focus-dependent navigation | [#66890](https://github.com/Expensify/App/pull/66890) |
