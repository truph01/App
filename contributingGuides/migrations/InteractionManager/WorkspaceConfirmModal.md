# Cluster 1: ConfirmModal Patterns 

## Strategy

**ConfirmModal pattern (ref + afterTransition)**

Nearly all workspace pages follow the same pattern: user confirms an action via a modal, then selections are cleared after the modal closes. Use a ConfirmModal ref with `afterTransition` to defer the cleanup.

For the few cases involving navigation (Plaid, NetSuite), use `Navigation.afterTransition` instead.

## Usages

| File                                        | Line | Current                             | Migration                    | PR                                                    |
| ------------------------------------------- | ---- | ----------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `WorkspaceMembersPage.tsx`                  | 272  | `setSelectedEmployees([])` + remove | ConfirmModal afterTransition | [#54178](https://github.com/Expensify/App/pull/54178) |
| `ReportParticipantsPage.tsx`                | 251  | `setSelectedMembers([])`            | ConfirmModal afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `ReportParticipantsPage.tsx`                | 446  | Same pattern                        | ConfirmModal afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `RoomMembersPage.tsx`                       | 155  | `setSelectedMembers([])`            | ConfirmModal afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `WorkspaceCategoriesPage.tsx`               | 346  | Category bulk action cleanup        | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceCategoriesSettingsPage.tsx`       | 346  | Category settings cleanup           | ConfirmModal afterTransition | [#56792](https://github.com/Expensify/App/pull/56792) |
| `WorkspaceTagsPage.tsx`                     | 437  | Tag bulk action cleanup             | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceViewTagsPage.tsx`                 | 221  | Tag view action cleanup             | ConfirmModal afterTransition | [#82523](https://github.com/Expensify/App/pull/82523) |
| `WorkspaceTaxesPage.tsx`                    | 250  | Tax bulk action cleanup             | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `PolicyDistanceRatesPage.tsx`               | 317  | Distance rate action cleanup        | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspacePerDiemPage.tsx`                  | 267  | Per diem action cleanup             | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `ReportFieldsListValuesPage.tsx`            | 195  | Report fields cleanup               | ConfirmModal afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceExpensifyCardDetailsPage.tsx`     | 94   | Card details cleanup                | ConfirmModal afterTransition | [#74530](https://github.com/Expensify/App/pull/74530) |
| `WorkspaceCompanyCardsSettingsPage.tsx`     | 88   | Card settings cleanup               | ConfirmModal afterTransition | [#57373](https://github.com/Expensify/App/pull/57373) |
| `WorkspaceWorkflowsPage.tsx`                | 141  | Workflows action cleanup            | ConfirmModal afterTransition | [#56932](https://github.com/Expensify/App/pull/56932) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx`   | 59   | Approvals edit cleanup              | ConfirmModal afterTransition | [#52163](https://github.com/Expensify/App/pull/52163) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx`   | 73   | Approvals edit cleanup              | ConfirmModal afterTransition | [#48618](https://github.com/Expensify/App/pull/48618) |
| `WorkspacesListPage.tsx`                    | 639  | Workspaces list action cleanup      | ConfirmModal afterTransition | [#69146](https://github.com/Expensify/App/pull/69146) |
| `PlaidConnectionStep.tsx`                   | 138  | Plaid connection navigation         | Navigation afterTransition   | [#64741](https://github.com/Expensify/App/pull/64741) |
| `NetSuiteImportAddCustomSegmentContent.tsx` | 51   | NetSuite segment navigation         | Navigation afterTransition   | [#51109](https://github.com/Expensify/App/pull/51109) |
| `NetSuiteImportAddCustomListContent.tsx`    | 48   | NetSuite list navigation            | Navigation afterTransition   | [#51109](https://github.com/Expensify/App/pull/51109) |
