# Modal After Transition 

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**ConfirmModal ref + `afterTransition` AND ReanimatedModal `afterTransition`**

Implement ref pattern for both ReanimatedModal and ConfirmModal.

```
const modalRef = useRef<ConfirmModalRef>(null);

modalRef.current.close({afterTransition: () => {
    // cleanup here
}});

return (
    <ConfirmModal
        ref={modalRef}
    />
);
``` 

Instead of:

```
setModalVisible(false);
InteractionManager.runAfterInteractions(() => {
    // cleanup here
});
```

## 1. ConfirmModal Pattern (ref + afterTransition)

Nearly all workspace pages follow the same pattern: user confirms an action via a modal, then selections are cleared after the modal closes. Use a ConfirmModal ref with `afterTransition` to defer the cleanup.

| File                                      | Line | Current                                         | Migration                                          | PR                                                    |
| ----------------------------------------- | ---- | ----------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `WorkspaceMembersPage.tsx`                | 272  | `setSelectedEmployees([])` + remove             | Use ConfirmModal ref approach with afterTransition | [#54178](https://github.com/Expensify/App/pull/54178) |
| `ReportParticipantsPage.tsx`              | 251  | `setSelectedMembers([])`                        | Use ConfirmModal ref approach with afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `ReportParticipantsPage.tsx`              | 446  | Same pattern                                    | Use ConfirmModal ref approach with afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `RoomMembersPage.tsx`                     | 155  | `setSelectedMembers([])`                        | Use ConfirmModal ref approach with afterTransition | [#50488](https://github.com/Expensify/App/pull/50488) |
| `WorkspaceCategoriesPage.tsx`             | 346  | Category bulk action cleanup                    | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceCategoriesSettingsPage.tsx`     | 346  | Category settings cleanup                       | Use ConfirmModal ref approach with afterTransition | [#56792](https://github.com/Expensify/App/pull/56792) |
| `WorkspaceTagsPage.tsx`                   | 437  | Tag bulk action cleanup                         | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceViewTagsPage.tsx`               | 221  | Tag view action cleanup                         | Use ConfirmModal ref approach with afterTransition | [#82523](https://github.com/Expensify/App/pull/82523) |
| `WorkspaceTaxesPage.tsx`                  | 250  | Tax bulk action cleanup                         | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `PolicyDistanceRatesPage.tsx`             | 317  | Distance rate action cleanup                    | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspacePerDiemPage.tsx`                | 267  | Per diem action cleanup                         | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `ReportFieldsListValuesPage.tsx`          | 195  | Report fields cleanup                           | Use ConfirmModal ref approach with afterTransition | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceExpensifyCardDetailsPage.tsx`   | 94   | Card details cleanup                            | Use ConfirmModal ref approach with afterTransition | [#74530](https://github.com/Expensify/App/pull/74530) |
| `WorkspaceCompanyCardsSettingsPage.tsx`   | 88   | Card settings cleanup                           | Use ConfirmModal ref approach with afterTransition | [#57373](https://github.com/Expensify/App/pull/57373) |
| `WorkspaceWorkflowsPage.tsx`              | 141  | Workflows action cleanup                        | Use ConfirmModal ref approach with afterTransition | [#56932](https://github.com/Expensify/App/pull/56932) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx` | 59   | Approvals edit cleanup                          | Use ConfirmModal ref approach with afterTransition | [#52163](https://github.com/Expensify/App/pull/52163) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx` | 73   | Approvals edit cleanup                          | Use ConfirmModal ref approach with afterTransition | [#48618](https://github.com/Expensify/App/pull/48618) |
| `WorkspacesListPage.tsx`                  | 639  | Workspaces list action cleanup                  | Use ConfirmModal ref approach with afterTransition | [#69146](https://github.com/Expensify/App/pull/69146) |
| `PopoverReportActionContextMenu.tsx`      | 374  | `deleteReportComment()` after confirm           | Use ConfirmModal ref approach with afterTransition | [#66791](https://github.com/Expensify/App/pull/66791) |
| `AutoSubmitModal.tsx`                     | 43   | `dismissASAPSubmitExplanation()` on modal close | Use ConfirmModal ref approach with afterTransition | [#63893](https://github.com/Expensify/App/pull/63893) |
| `useFilesValidation.tsx`                  | 108  | InteractionManager deferring file validation    | Use ConfirmModal ref approach with afterTransition | [#65316](https://github.com/Expensify/App/pull/65316) |
| `useFilesValidation.tsx`                  | 365  | InteractionManager deferring file validation    | Use ConfirmModal ref approach with afterTransition | [#65316](https://github.com/Expensify/App/pull/65316) |
| `ContactMethodDetailsPage.tsx`            | 130  | Open delete modal after keyboard dismiss        | Use ConfirmModal ref approach with afterTransition | [#35305](https://github.com/Expensify/App/pull/35305) |
| `IOURequestStepMerchant.tsx`              | 181  | Merchant submit + keyboard dismiss              | Use ConfirmModal ref approach with afterTransition | [#67010](https://github.com/Expensify/App/pull/67010) |
| `IOURequestStepDescription.tsx`           | 226  | Description submit + keyboard dismiss           | Use ConfirmModal ref approach with afterTransition | [#67010](https://github.com/Expensify/App/pull/67010) |


## 2. ReanimatedModal Pattern (afterTransition callback)

These usages involve ReanimatedModal's ref pattern to defer work until after the modal close animation.

| File                                  | Line | Current                                       | Migration                                             | PR                                                    |
| ------------------------------------- | ---- | --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `FeatureTrainingModal.tsx`            | 224  | `setIsModalVisible` based on disabled state   | Use ReanimatedModal ref approach with afterTransition | [#57649](https://github.com/Expensify/App/pull/57649) |
| `FeatureTrainingModal.tsx`            | 352  | goBack + onClose after setting invisible      | Use ReanimatedModal ref approach with afterTransition | [#53225](https://github.com/Expensify/App/pull/53225) |
| `AvatarCropModal/AvatarCropModal.tsx` | 324  | InteractionManager deferring onClose          | Use ReanimatedModal ref approach with afterTransition | [#66890](https://github.com/Expensify/App/pull/66890) |
| `AttachmentModalHandler/index.ios.ts` | 12   | iOS: execute close callback after interaction | Use ReanimatedModal ref approach with afterTransition | [#53108](https://github.com/Expensify/App/pull/53108) |
