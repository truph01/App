# Cluster 9: Search API Operations (~3 usages)

## Strategy

**Use `requestIdleCallback`**

Search API calls and contact imports are non-urgent background work that should not block rendering or animations. `requestIdleCallback` schedules them during idle periods.

## Usages

| File                                   | Line | Current                                      | Migration                                                                                                                                                                    | PR                                                    |
| -------------------------------------- | ---- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useSearchHighlightAndScroll.ts`       | 126  | InteractionManager deferring search API call | Try to use `requestIdleCallback(() => search(...))` or startTransition to defer the search API call                                                                          | [#69713](https://github.com/Expensify/App/pull/69713) |
| `useSearchSelector.native.ts`          | 27   | InteractionManager deferring contact import  | Try to use `requestIdleCallback(importAndSaveContacts)` or startTransition to defer the contact import                                                                       | [#70700](https://github.com/Expensify/App/pull/70700) |
| `MoneyRequestParticipantsSelector.tsx` | 431  | InteractionManager deferring contact import  | InteractionManager was used as a workaround to defer the contact import, now use `requestIdleCallback(importAndSaveContacts)` or startTransition to defer the contact import | [#54459](https://github.com/Expensify/App/pull/54459) |
