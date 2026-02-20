# Modal After Transition

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**Migrate to `useConfirmModal` hook**

The `showConfirmModal` function returned by `useConfirmModal` returns a Promise that resolves **after the modal close transition completes** (the underlying `closeModal` is called inside `onModalHide`, which fires after the animation finishes). This means any code that `await`s the result already runs post-transition — no explicit `afterTransition` callback is needed.

```typescript
const {showConfirmModal} = useConfirmModal();

const {action} = await showConfirmModal({
    title: 'Delete items?',
    prompt: 'This cannot be undone.',
    confirmText: 'Delete',
    danger: true,
});

if (action !== ModalActions.CONFIRM) {
    return;
}

// This runs after the modal close transition — cleanup here
setSelectedItems([]);
deleteItems();
```

Instead of:

```
setModalVisible(false);
InteractionManager.runAfterInteractions(() => {
    // cleanup here
});
```

For **ReanimatedModal** usages, use ref pattern (ref.current.open({afterTransition: callback})) with `afterTransition` to defer work until after the modal close animation

## 1. ConfirmModal Pattern (migrate to `useConfirmModal` hook)

Nearly all workspace pages follow the same pattern: user confirms an action via a modal, then selections are cleared after the modal closes. Migrate from inline `<ConfirmModal>` component + `InteractionManager` to the `useConfirmModal` hook, whose promise resolves after the close transition.

| File                                      | Line | Current                                         | Migration                         | PR                                                    |
| ----------------------------------------- | ---- | ----------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| `WorkspaceMembersPage.tsx`                | 272  | `setSelectedEmployees([])` + remove             | Migrate to `useConfirmModal` hook | [#54178](https://github.com/Expensify/App/pull/54178) |
| `ReportParticipantsPage.tsx`              | 251  | `setSelectedMembers([])`                        | Migrate to `useConfirmModal` hook | [#50488](https://github.com/Expensify/App/pull/50488) |
| `ReportParticipantsPage.tsx`              | 446  | Same pattern                                    | Migrate to `useConfirmModal` hook | [#50488](https://github.com/Expensify/App/pull/50488) |
| `RoomMembersPage.tsx`                     | 155  | `setSelectedMembers([])`                        | Migrate to `useConfirmModal` hook | [#50488](https://github.com/Expensify/App/pull/50488) |
| `WorkspaceCategoriesPage.tsx`             | 346  | Category bulk action cleanup                    | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceCategoriesSettingsPage.tsx`     | 346  | Category settings cleanup                       | Migrate to `useConfirmModal` hook | [#56792](https://github.com/Expensify/App/pull/56792) |
| `WorkspaceTagsPage.tsx`                   | 437  | Tag bulk action cleanup                         | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceViewTagsPage.tsx`               | 221  | Tag view action cleanup                         | Migrate to `useConfirmModal` hook | [#82523](https://github.com/Expensify/App/pull/82523) |
| `WorkspaceTaxesPage.tsx`                  | 250  | Tax bulk action cleanup                         | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `PolicyDistanceRatesPage.tsx`             | 317  | Distance rate action cleanup                    | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspacePerDiemPage.tsx`                | 267  | Per diem action cleanup                         | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `ReportFieldsListValuesPage.tsx`          | 195  | Report fields cleanup                           | Migrate to `useConfirmModal` hook | [#60023](https://github.com/Expensify/App/pull/60023) |
| `WorkspaceExpensifyCardDetailsPage.tsx`   | 94   | Card details cleanup                            | Migrate to `useConfirmModal` hook | [#74530](https://github.com/Expensify/App/pull/74530) |
| `WorkspaceCompanyCardsSettingsPage.tsx`   | 88   | Card settings cleanup                           | Migrate to `useConfirmModal` hook | [#57373](https://github.com/Expensify/App/pull/57373) |
| `WorkspaceWorkflowsPage.tsx`              | 141  | Workflows action cleanup                        | Migrate to `useConfirmModal` hook | [#56932](https://github.com/Expensify/App/pull/56932) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx` | 59   | Approvals edit cleanup                          | Migrate to `useConfirmModal` hook | [#52163](https://github.com/Expensify/App/pull/52163) |
| `WorkspaceWorkflowsApprovalsEditPage.tsx` | 73   | Approvals edit cleanup                          | Migrate to `useConfirmModal` hook | [#48618](https://github.com/Expensify/App/pull/48618) |
| `WorkspacesListPage.tsx`                  | 639  | Workspaces list action cleanup                  | Migrate to `useConfirmModal` hook | [#69146](https://github.com/Expensify/App/pull/69146) |
| `PopoverReportActionContextMenu.tsx`      | 374  | `deleteReportComment()` after confirm           | Migrate to `useConfirmModal` hook | [#66791](https://github.com/Expensify/App/pull/66791) |
| `AutoSubmitModal.tsx`                     | 43   | `dismissASAPSubmitExplanation()` on modal close | Migrate to `useConfirmModal` hook | [#63893](https://github.com/Expensify/App/pull/63893) |
| `useFilesValidation.tsx`                  | 108  | InteractionManager deferring file validation    | Migrate to `useConfirmModal` hook | [#65316](https://github.com/Expensify/App/pull/65316) |
| `useFilesValidation.tsx`                  | 365  | InteractionManager deferring file validation    | Migrate to `useConfirmModal` hook | [#65316](https://github.com/Expensify/App/pull/65316) |
| `ContactMethodDetailsPage.tsx`            | 130  | Open delete modal after keyboard dismiss        | Migrate to `useConfirmModal` hook | [#35305](https://github.com/Expensify/App/pull/35305) |
| `IOURequestStepMerchant.tsx`              | 181  | Merchant submit + keyboard dismiss              | Migrate to `useConfirmModal` hook | [#67010](https://github.com/Expensify/App/pull/67010) |
| `IOURequestStepDescription.tsx`           | 226  | Description submit + keyboard dismiss           | Migrate to `useConfirmModal` hook | [#67010](https://github.com/Expensify/App/pull/67010) |


## 2. ReanimatedModal Pattern (afterTransition callback)

These usages involve ReanimatedModal's ref pattern to defer work until after the modal close animation.

| File                                  | Line | Current                                       | Migration                                             | PR                                                    |
| ------------------------------------- | ---- | --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `FeatureTrainingModal.tsx`            | 224  | `setIsModalVisible` based on disabled state   | Use ReanimatedModal ref approach with afterTransition | [#57649](https://github.com/Expensify/App/pull/57649) |
| `FeatureTrainingModal.tsx`            | 352  | goBack + onClose after setting invisible      | Use ReanimatedModal ref approach with afterTransition | [#53225](https://github.com/Expensify/App/pull/53225) |
| `AvatarCropModal/AvatarCropModal.tsx` | 324  | InteractionManager deferring onClose          | Use ReanimatedModal ref approach with afterTransition | [#66890](https://github.com/Expensify/App/pull/66890) |
| `AttachmentModalHandler/index.ios.ts` | 12   | iOS: execute close callback after interaction | Use ReanimatedModal ref approach with afterTransition | [#53108](https://github.com/Expensify/App/pull/53108) |
