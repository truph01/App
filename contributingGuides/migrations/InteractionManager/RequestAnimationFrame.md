# requestAnimationFrame (~6 usages)

## Strategy

**Use `requestAnimationFrame` for non-scroll UI yields**

These usages need to yield to the UI thread for a single frame before performing an action (state update, navigation after synchronous Onyx flush, etc.). `requestAnimationFrame` is the correct primitive — it ensures the callback runs after the current frame is painted.

## Usages

| File                                 | Line | Current                                                                                             | Migration                                                                          | PR                                                    |
| ------------------------------------ | ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `OptionRow.tsx`                      | 195  | InteractionManager re-enabling row                                                                  | `requestAnimationFrame(() => setIsDisabled(false))` (yield to UI)                  | [#14426](https://github.com/Expensify/App/pull/14426) |
| `MoneyReportHeader.tsx`              | 574  | iOS-only: show hold menu after interaction                                                          | `requestAnimationFrame(() => setIsHoldMenuVisible(true))` (iOS animation workaround) | [#66790](https://github.com/Expensify/App/pull/66790) |
| `TaskAssigneeSelectorModal.tsx`      | 181  | Edit task assignee via `setAssigneeValue` + `editTaskAssignee`, then defer `dismissModalWithReport` | `requestAnimationFrame(() => Navigation.dismissModalWithReport({reportID}))`       | [#81320](https://github.com/Expensify/App/pull/81320) |
| `TaskAssigneeSelectorModal.tsx`      | 194  | Set assignee for new task via `setAssigneeValue`, then defer `goBack` to `NEW_TASK` route           | `requestAnimationFrame(() => Navigation.goBack(ROUTES.NEW_TASK.getRoute(backTo)))` | [#81320](https://github.com/Expensify/App/pull/81320) |
| `useSingleExecution/index.native.ts` | 27   | InteractionManager resetting `isExecuting`                                                          | `requestAnimationFrame(() => setIsExecuting(false))` — yield to allow UI updates before resetting state, if it doesn't work use `TransitionTracker.runAfterTransitions` | [#24173](https://github.com/Expensify/App/pull/24173) |
| `WorkspaceNewRoomPage.tsx`           | 136  | `addPolicyReport()` deferred                                                                        | `requestAnimationFrame(() => addPolicyReport())` (no navigation involved)          | [#59207](https://github.com/Expensify/App/pull/59207) |
