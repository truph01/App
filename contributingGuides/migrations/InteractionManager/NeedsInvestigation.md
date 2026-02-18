# Needs Investigation 

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**Requires deeper investigation before choosing a migration approach**

These usages don't clearly fit into any of the standard migration patterns and need further analysis.

## Usages

| File                                 | Line | Current                                       | Migration                                                                                                                                                                                           | PR                                                    |
| ------------------------------------ | ---- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `DatePicker/index.tsx`               | 107  | InteractionManager deferring popover position | Need deeper investigation                                                                                                                                                                           | [#62354](https://github.com/Expensify/App/pull/62354) |
| `DatePicker/index.tsx`               | 118  | InteractionManager deferring handlePress      | Need deeper investigation                                                                                                                                                                           | [#56068](https://github.com/Expensify/App/pull/56068) |
| `PlaidConnectionStep.tsx`            | 138  | Plaid connection navigation                   | Navigation afterTransition                                                                                                                                                                          | [#64741](https://github.com/Expensify/App/pull/64741) |
| `OptionRow.tsx`                      | 195  | InteractionManager re-enabling row            | Need deeper investigation / `requestAnimationFrame(() => setIsDisabled(false))` (yield to UI)                                                                                                       | [#14426](https://github.com/Expensify/App/pull/14426) |
| `MoneyReportHeader.tsx`              | 574  | iOS-only: show hold menu after interaction    | Need deeper investigation / `requestAnimationFrame(() => setIsHoldMenuVisible(true))` (iOS animation workaround)                                                                                    | [#66790](https://github.com/Expensify/App/pull/66790) |
| `useSingleExecution/index.native.ts` | 27   | InteractionManager resetting `isExecuting`    | Need deeper investigation / `requestAnimationFrame(() => setIsExecuting(false))` — yield to allow UI updates before resetting state, if it doesn't work use `TransitionTracker.runAfterTransitions` | [#24173](https://github.com/Expensify/App/pull/24173) |
| `WorkspaceNewRoomPage.tsx`           | 136  | `addPolicyReport()` deferred                  | Need deeper investigation / `requestAnimationFrame(() => addPolicyReport())` (no navigation involved)                                                                                               | [#59207](https://github.com/Expensify/App/pull/59207) |
| `NewTaskPage.tsx`                    | 63   | `blurActiveElement()` on focus                | Need deeper investigation                                                                                                                                                                           | [#79597](https://github.com/Expensify/App/pull/79597) |
| `IOURequestStepSubrate.tsx`          | 234  | Subrate selection + keyboard dismiss          | `KeyboardUtils.dismiss({afterTransition})`                                                                                                                                                          | [#56347](https://github.com/Expensify/App/pull/56347) |
