# Cluster 16: Task Assignee (2 usages)

## Strategy

**Use `requestAnimationFrame`**

Both usages defer navigation after synchronous Onyx state updates (`setAssigneeValue`, `editTaskAssignee`). The deferral gives the optimistic updates a frame to flush before navigating. Replace with `requestAnimationFrame`.

## Usages

| File                            | Line | Current                                                                                             | Migration                                                                          | PR                                                     |
| ------------------------------- | ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `TaskAssigneeSelectorModal.tsx` | 181  | Edit task assignee via `setAssigneeValue` + `editTaskAssignee`, then defer `dismissModalWithReport` | `requestAnimationFrame(() => Navigation.dismissModalWithReport({reportID}))`       | [#81320](https://github.com/Expensify/App/pull/81320) |
| `TaskAssigneeSelectorModal.tsx` | 194  | Set assignee for new task via `setAssigneeValue`, then defer `goBack` to `NEW_TASK` route           | `requestAnimationFrame(() => Navigation.goBack(ROUTES.NEW_TASK.getRoute(backTo)))` | [#81320](https://github.com/Expensify/App/pull/81320) |
