# requestIdleCallback

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**Use `requestIdleCallback` for non-urgent background work**

Pusher subscriptions, typing event listeners, search API calls, and contact imports are non-urgent background work. They should not block rendering or animations. `requestIdleCallback` schedules them during idle periods.

## 1. Realtime Subscriptions

| File                          | Line | Current                                    | Migration                                               | PR                                                    |
| ----------------------------- | ---- | ------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------- |
| `Pusher/index.ts`             | 206  | InteractionManager wrapping subscribe call | Replace with `requestIdleCallback(() => subscribe())`   | [#53751](https://github.com/Expensify/App/pull/53751) |
| `Pusher/index.native.ts`      | 211  | InteractionManager wrapping subscribe call | Replace with `requestIdleCallback(() => subscribe())`   | [#56610](https://github.com/Expensify/App/pull/56610) |
| `UserTypingEventListener.tsx` | 35   | InteractionManager wrapping unsubscribe    | Replace with `requestIdleCallback(() => unsubscribe())` | [#39347](https://github.com/Expensify/App/pull/39347) |
| `UserTypingEventListener.tsx` | 49   | Store ref for InteractionManager handle    | Update to store `requestIdleCallback` handle ref        | [#39347](https://github.com/Expensify/App/pull/39347) |
| `UserTypingEventListener.tsx` | 59   | InteractionManager wrapping subscribe      | Replace with `requestIdleCallback(() => subscribe())`   | [#39347](https://github.com/Expensify/App/pull/39347) |
| `UserTypingEventListener.tsx` | 70   | InteractionManager wrapping unsubscribe    | Replace with `requestIdleCallback(() => unsubscribe())` | [#39347](https://github.com/Expensify/App/pull/39347) |

---

## 2. Search API Operations

| File                                   | Line | Current                                      | Migration                                                                                                | PR                                                    |
| -------------------------------------- | ---- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useSearchHighlightAndScroll.ts`       | 126  | InteractionManager deferring search API call | Try to use `requestIdleCallback(() => search(...))` or `startTransition` to defer the search API call    | [#69713](https://github.com/Expensify/App/pull/69713) |
| `useSearchSelector.native.ts`          | 27   | InteractionManager deferring contact import  | Try to use `requestIdleCallback(importAndSaveContacts)` or `startTransition` to defer the contact import | [#70700](https://github.com/Expensify/App/pull/70700) |
| `MoneyRequestParticipantsSelector.tsx` | 431  | InteractionManager deferring contact import  | Use `requestIdleCallback(importAndSaveContacts)` or `startTransition` to defer the contact import        | [#54459](https://github.com/Expensify/App/pull/54459) |
