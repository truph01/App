# Navigation After Transition (~60 usages)

## Strategy

**Use `Navigation.navigate/goBack/dismissModal({afterTransition: callback})`**

Every usage in this file defers work until after a screen/modal transition completes. Replace each `InteractionManager.runAfterInteractions()` call with the `afterTransition` option available on Navigation methods.

`TransitionTracker.runAfterTransitions()` should **never** be called directly — it is already wired into `Navigation.ts` internally.

---

## 1. Navigation Utility Files

| File                                    | Line       | Current                          | Migration                                                                         | PR                                                    |
| --------------------------------------- | ---------- | -------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `navigateAfterInteraction/index.ios.ts` | 10         | iOS wrapper deferring navigation | Replace with `Navigation.navigate({afterTransition})` — remove this file entirely | [#56865](https://github.com/Expensify/App/pull/56865) |
| `navigateAfterInteraction/index.ts`     | 1          | Non-iOS passthrough              | Remove file (merged into Navigation API)                                          | [#56865](https://github.com/Expensify/App/pull/56865) |

---

## 2. Direct Navigation Calls

| File                                      | Line       | Current                          | Migration                                                         | PR                                                    |
| ----------------------------------------- | ---------- | -------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| `SubmitDetailsPage.tsx`                   | 263        | `navigateAfterInteraction` call  | Use `Navigation.navigate(route, {afterTransition})`               | [#58834](https://github.com/Expensify/App/pull/58834) |
| `TestToolsModalPage.tsx`                  | 73         | `navigateAfterInteraction` call  | Use `Navigation.navigate(route, {afterTransition})`               | [#64717](https://github.com/Expensify/App/pull/64717) |
| `IOURequestStepConfirmation.tsx`          | 1390, 1396 | `navigateAfterInteraction` calls | Use `Navigation.navigate(route, {afterTransition})`               | [#58422](https://github.com/Expensify/App/pull/58422) |
| `DiscardChangesConfirmation/index.tsx`    | 32, 62     | Toggle visibility after discard  | Use `Navigation.navigate(route, {afterTransition})`               | File removed                                          |
| `WorkspaceMemberDetailsPage.tsx`          | 170        | Go back after member action      | Use `Navigation.goBack({afterTransition})`                        | [#79597](https://github.com/Expensify/App/pull/79597) |
| `FloatingActionButtonAndPopover.tsx`      | 702        | FAB menu item action             | Use `Navigation.navigate(route, {afterTransition})`               | [#56865](https://github.com/Expensify/App/pull/56865) |
| `Session/index.ts`                        | 1248       | Navigate after sign-in           | Use `Navigation.navigate(route, {afterTransition})`               | [#30269](https://github.com/Expensify/App/pull/30269) |
| `Link.ts`                                 | 305        | Deep link navigation             | Use `Navigation.navigate(route, {afterTransition})`               | [#74237](https://github.com/Expensify/App/pull/74237) |
| `Tour.ts`                                 | 9          | Tour navigation                  | Use `Navigation.navigate(route, {afterTransition})`               | [#67348](https://github.com/Expensify/App/pull/67348) |
| `AdminTestDriveModal.tsx`                 | 21         | Navigate to test drive           | Use `Navigation.navigate(route, {afterTransition})`               | [#60997](https://github.com/Expensify/App/pull/60997) |
| `EmployeeTestDriveModal.tsx`              | 108        | Navigate to money request        | Use `Navigation.navigate(route, {afterTransition})`               | [#63260](https://github.com/Expensify/App/pull/63260) |
| `TestDriveDemo.tsx`                       | 68, 76     | Set visibility / go back         | Use `Navigation.goBack({afterTransition})`                        | [#60085](https://github.com/Expensify/App/pull/60085) |
| `ImportedMembersPage.tsx`                 | 204        | Navigate back after import       | Use `Navigation.goBack({afterTransition})`                        | [#69436](https://github.com/Expensify/App/pull/69436) |
| `ImportedMembersConfirmationPage.tsx`     | 210        | Navigate back                    | Use `Navigation.goBack({afterTransition})`                        | [#75515](https://github.com/Expensify/App/pull/75515) |
| `WorkspaceDowngradePage.tsx`              | 70, 84     | Navigate after downgrade         | Use `Navigation.navigate/dismissModal({afterTransition})`         | [#71333](https://github.com/Expensify/App/pull/71333) |
| `DebugReportActionPage.tsx`               | 69         | Defer deletion during nav        | Use `Navigation.goBack({afterTransition: () => deleteAction()})`  | [#53655](https://github.com/Expensify/App/pull/53655) |
| `DebugTransactionPage.tsx`                | 65         | Defer transaction deletion       | Use `Navigation.goBack({afterTransition: () => deleteTx()})`      | [#53655](https://github.com/Expensify/App/pull/53655) |
| `DebugTransactionViolationPage.tsx`       | 53         | Defer violation deletion         | Use `Navigation.goBack({afterTransition: () => deleteViolation()})` | [#53969](https://github.com/Expensify/App/pull/53969) |

---

## 3. IOU/Transaction Draft Cleanup

**Pattern: Thread through `Navigation.afterTransition` in `handleNavigateAfterExpenseCreate`**

| File                 | Line  | Current                                            | Migration                                                                              | PR                                                     |
| -------------------- | ----- | -------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `IOU/index.ts`       | 6374  | `removeDraftTransactions()` after split bill       | Pass as `afterTransition` to the navigation call in `handleNavigateAfterExpenseCreate` | [#61574](https://github.com/Expensify/App/pull/61574) |
| `IOU/index.ts`       | 6501  | `removeDraftTransaction()` after per diem          | Same — thread through navigation                                                       | [#54760](https://github.com/Expensify/App/pull/54760) |
| `IOU/index.ts`       | 6834  | `removeDraftTransactions()` after distance request | Same                                                                                   | [#78109](https://github.com/Expensify/App/pull/78109) |
| `IOU/index.ts`       | 7522  | `removeDraftTransaction()`                         | Same                                                                                   | [#53852](https://github.com/Expensify/App/pull/53852) |
| `IOU/index.ts`       | 7613  | `removeDraftTransaction()`                         | Same                                                                                   | [#51940](https://github.com/Expensify/App/pull/51940) |
| `IOU/index.ts`       | 8281  | `removeDraftTransaction()`                         | Same                                                                                   | [#51940](https://github.com/Expensify/App/pull/51940) |
| `IOU/index.ts`       | 8539  | `removeDraftTransaction()`                         | Same                                                                                   | [#51940](https://github.com/Expensify/App/pull/51940) |
| `IOU/index.ts`       | 9059  | Clear draft transaction data                       | Same                                                                                   | [#51940](https://github.com/Expensify/App/pull/51940) |
| `IOU/index.ts`       | 14208 | `removeDraftSplitTransaction()`                    | Same                                                                                   | [#79648](https://github.com/Expensify/App/pull/79648) |
| `IOU/SendInvoice.ts` | 787   | `removeDraftTransaction()` after invoice           | Same                                                                                   | [#78512](https://github.com/Expensify/App/pull/78512) |
| `IOU/index.ts`       | 1154  | Navigate after `dismissModal()`                    | Use `Navigation.dismissModal({afterTransition: () => navigate()})`                     | [#81580](https://github.com/Expensify/App/pull/81580) |

---

## 4. Task State Cleanup

| File      | Line | Current                                      | Migration                                                                                                   | PR                                                    |
| --------- | ---- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Task.ts` | 319  | `clearOutTaskInfo()` + `dismissModalWithReport` | Use `dismissModalWithReport({afterTransition: () => clearOutTaskInfo()})` | [#57864](https://github.com/Expensify/App/pull/57864) |

---

## 5. Card Assignment Cleanup

| File                   | Line | Current                                          | Migration                                                                                                    | PR                                                    |
| ---------------------- | ---- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `ConfirmationStep.tsx` | 76   | `clearAssignCardStepAndData()` after `dismissModal()` | Use `Navigation.dismissModal({afterTransition: () => clearAssignCardStepAndData()})` | [#58630](https://github.com/Expensify/App/pull/58630) |

---

## 6. Two-Factor Auth Cleanup

| File                      | Line | Current                                      | Migration                                                                                                 | PR                                                    |
| ------------------------- | ---- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `TwoFactorAuthActions.ts` | 28   | `clearTwoFactorAuthData()` after `goBack()` | Use `Navigation.goBack({afterTransition: () => clearTwoFactorAuthData()})` | [#54404](https://github.com/Expensify/App/pull/54404) |

---

## 7. Report State Cleanup

| File                         | Line | Current                                              | Migration                                                                                | PR                                                    |
| ---------------------------- | ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Report/index.ts`            | 1176 | `clearGroupChat()` during creation                   | Use `Navigation.afterTransition` on the subsequent navigation                            | [#57864](https://github.com/Expensify/App/pull/57864) |
| `Report/index.ts`            | 1909 | Clear report data                                    | Navigation afterTransition                                                               | [#47033](https://github.com/Expensify/App/pull/47033) |
| `Report/index.ts`            | 3328 | `deleteReport()` after `goBack()/popToSidebar()`    | `Navigation.goBack({afterTransition: () => deleteReport()})`                             | [#66890](https://github.com/Expensify/App/pull/66890) |
| `Report/index.ts`            | 5814 | Clear report data                                    | Navigation afterTransition                                                               | [#66890](https://github.com/Expensify/App/pull/66890) |
| `MoneyRequestReportView.tsx` | 137  | `removeFailedReport()` after `goBackFromSearchMoneyRequest()` | Thread afterTransition through goBack                                            | [#59386](https://github.com/Expensify/App/pull/59386) |

---

## 8. Report Screen Actions

| File                              | Line | Current                                          | Migration                                                          | PR                                                    |
| --------------------------------- | ---- | ------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------- |
| `ReportScreen.tsx`                | 493  | Clear `deleteTransactionNavigateBackUrl`         | `Navigation.afterTransition` (post-navigation cleanup)             | [#52740](https://github.com/Expensify/App/pull/52740) |
| `ReportScreen.tsx`                | 681  | `setShouldShowComposeInput(true)` on mount       | `Navigation.afterTransition` (show after screen entry)             | [#38255](https://github.com/Expensify/App/pull/38255) |
| `ReportScreen.tsx`                | 884  | Subscribe to report leaving events               | `Navigation.afterTransition` (after report screen loads)           | [#30269](https://github.com/Expensify/App/pull/30269) |
| `ReportActionsView.tsx`           | 286  | Set `navigatingToLinkedMessage` state            | `Navigation.afterTransition` then `setTimeout(10)`                 | [#30269](https://github.com/Expensify/App/pull/30269) |
| `BaseReportActionContextMenu.tsx` | 317  | `signOutAndRedirectToSignIn()` after hiding menu | Use context menu's `hideContextMenu` callback with afterTransition | [#33715](https://github.com/Expensify/App/pull/33715) |
| `PureReportActionItem.tsx`        | 1740 | Sign out and redirect                            | `Navigation.navigate({afterTransition})` or `requestAnimationFrame` | [#52948](https://github.com/Expensify/App/pull/52948) |

---

## 9. Component-Specific Navigation

| File                   | Line | Current                            | Migration                                                        | PR                                                    |
| ---------------------- | ---- | ---------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `MoneyReportHeader.tsx` | 1503 | Delete transaction after nav setup | `Navigation.goBack({afterTransition: () => deleteTransactions()})` | [#74605](https://github.com/Expensify/App/pull/74605) |
| `MoneyReportHeader.tsx` | 1526 | Delete report after goBack         | `Navigation.goBack({afterTransition: () => deleteAppReport()})`  | [#79539](https://github.com/Expensify/App/pull/79539) |

---

## 10. Settings Pages

| File                           | Line | Current                               | Migration                                                                                                  | PR                                                    |
| ------------------------------ | ---- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `StatusPage.tsx`               | 136  | `clearDraftCustomStatus()` + navigate | Remove navigateBackToPreviousScreenTask and use `Navigation.goBack({afterTransition: () => clearDraft()})` | [#40364](https://github.com/Expensify/App/pull/40364) |
| `StatusPage.tsx`               | 157  | Navigate back after status action     | Remove navigateBackToPreviousScreenTask and use `Navigation.goBack({afterTransition})`                     | [#40364](https://github.com/Expensify/App/pull/40364) |
| `TwoFactorAuth/VerifyPage.tsx` | 79   | 2FA verify navigation                 | Investigate if InteractionManager is needed                                                                | [#67762](https://github.com/Expensify/App/pull/67762) |

---

## 11. Workspace Navigation (from WorkspaceConfirmModal)

| File                                        | Line | Current                         | Migration                      | PR                                                    |
| ------------------------------------------- | ---- | ------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `PlaidConnectionStep.tsx`                   | 138  | Plaid connection navigation     | Navigation afterTransition     | [#64741](https://github.com/Expensify/App/pull/64741) |
| `NetSuiteImportAddCustomSegmentContent.tsx` | 51   | NetSuite segment navigation     | Navigation afterTransition     | [#51109](https://github.com/Expensify/App/pull/51109) |
| `NetSuiteImportAddCustomListContent.tsx`    | 48   | NetSuite list navigation        | Navigation afterTransition     | [#51109](https://github.com/Expensify/App/pull/51109) |

---

## 12. IOU Request Steps Navigation

| File                                       | Line | Current                   | Migration                                | PR                                                    |
| ------------------------------------------ | ---- | ------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `IOURequestStepReport.tsx`                 | 156  | Report selection + navigate | `Navigation.goBack({afterTransition})` | [#67048](https://github.com/Expensify/App/pull/67048) |
| `IOURequestStepReport.tsx`                 | 211  | Report selection + navigate | `Navigation.goBack({afterTransition})` | [#67925](https://github.com/Expensify/App/pull/67925) |
| `IOURequestStepScan/index.native.tsx`      | 374  | Scan step navigation        | `Navigation.navigate({afterTransition})` | [#63451](https://github.com/Expensify/App/pull/63451) |
| `IOURequestStepScan/ReceiptView/index.tsx` | 70   | Receipt view navigation     | `Navigation.navigate({afterTransition})` | [#63352](https://github.com/Expensify/App/pull/63352) |
| `IOURequestStepScan/index.tsx`             | 624  | Scan step navigation        | `Navigation.navigate({afterTransition})` | [#63451](https://github.com/Expensify/App/pull/63451) |
| `SplitExpensePage.tsx`                     | 392  | Split expense navigation    | `Navigation.navigate({afterTransition})` | [#79597](https://github.com/Expensify/App/pull/79597) |

---

## 13. Modal/Component State (Navigation-based)

| File                             | Line | Current                                           | Migration                                                                                 | PR                                                    |
| -------------------------------- | ---- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `AddUnreportedExpenseFooter.tsx` | 57   | Bulk convert after `dismissToSuperWideRHP()`      | Use `Navigation.dismissToSuperWideRHP({afterTransition: () => convert()})`                | [#79328](https://github.com/Expensify/App/pull/79328) |

---

## 14. Right Modal Navigator

| File                    | Line     | Current                          | Migration                                             | PR                                                                                                            |
| ----------------------- | -------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `RightModalNavigator.tsx` | 130, 198 | Save scroll offsets / clear 2FA | Use `Navigation.afterTransition` in the navigator     | [#69531](https://github.com/Expensify/App/pull/69531), [#79473](https://github.com/Expensify/App/pull/79473) |
