# Navigation waitForTransition

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**Use `Navigation.navigate/goBack/dismissModal` with `{ waitForTransition: true }`**

These call sites wrap `Navigation.navigate`, `Navigation.goBack`, or `Navigation.dismissModal` in `InteractionManager.runAfterInteractions`. Since `navigate`, `goBack`, and `dismissModal` now accept a `waitForTransition` option that internally defers through `TransitionTracker.runAfterTransitions`, the `InteractionManager` wrapper can be removed and replaced with the option.

Instead of:

```ts
InteractionManager.runAfterInteractions(() => {
    Navigation.navigate(ROUTES.SOME_ROUTE);
});
```

Use:

```ts
Navigation.navigate(ROUTES.SOME_ROUTE, { waitForTransition: true });
```

Instead of:

```ts
InteractionManager.runAfterInteractions(() => {
    Navigation.goBack(ROUTES.SOME_ROUTE);
});
```

Use:

```ts
Navigation.goBack(ROUTES.SOME_ROUTE, { waitForTransition: true });
```

## Navigation Utility Files

These utility files exist solely to wrap navigation calls in `InteractionManager` and should be removed entirely once the migration is complete.

| File                                    | Line | Current                          | Migration                                       | PR                                                    |
| --------------------------------------- | ---- | -------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `navigateAfterInteraction/index.ios.ts` | 10   | iOS wrapper deferring navigation | Remove file — `waitForTransition` replaces this | [#56865](https://github.com/Expensify/App/pull/56865) |
| `navigateAfterInteraction/index.ts`     | 1    | Non-iOS passthrough              | Remove file                                     | [#56865](https://github.com/Expensify/App/pull/56865) |

## Usages

| File                                       | Line       | Current                                                                  | Migration                                                                               | PR                                                    |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `ImportedMembersPage.tsx`                  | 204        | `InteractionManager` wrapping `Navigation.goBack` in `onModalHide`       | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#69436](https://github.com/Expensify/App/pull/69436) |
| `ImportedMembersConfirmationPage.tsx`      | 210        | `InteractionManager` wrapping `Navigation.goBack` in `onModalHide`       | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#75515](https://github.com/Expensify/App/pull/75515) |
| `AdminTestDriveModal.tsx`                  | 21         | `InteractionManager` wrapping `Navigation.navigate`                      | `Navigation.navigate(route, { waitForTransition: true })`                               | [#60997](https://github.com/Expensify/App/pull/60997) |
| `EmployeeTestDriveModal.tsx`               | 110        | `InteractionManager` wrapping `Navigation.navigate` after `goBack`       | `Navigation.navigate(route, { waitForTransition: true })`                               | [#63260](https://github.com/Expensify/App/pull/63260) |
| `TaskAssigneeSelectorModal.tsx`            | 181        | `InteractionManager` wrapping `Navigation.dismissModalWithReport`        | Remove `InteractionManager` wrapper (delegates to `navigate`/`dismissModal` internally) | [#81320](https://github.com/Expensify/App/pull/81320) |
| `TaskAssigneeSelectorModal.tsx`            | 194        | `InteractionManager` wrapping `Navigation.goBack`                        | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#81320](https://github.com/Expensify/App/pull/81320) |
| `IOU/index.ts`                             | 1154       | `InteractionManager` wrapping `Navigation.navigate` after `dismissModal` | `Navigation.navigate(route, { waitForTransition: true })`                               | [#81580](https://github.com/Expensify/App/pull/81580) |
| `Report/index.ts`                          | 5912       | `InteractionManager` wrapping `Navigation.navigate`                      | `Navigation.navigate(route, { waitForTransition: true })`                               | [#66890](https://github.com/Expensify/App/pull/66890) |
| `SubmitDetailsPage.tsx`                    | 263        | `navigateAfterInteraction` call                                          | `Navigation.navigate(route, { waitForTransition: true })`                               | [#58834](https://github.com/Expensify/App/pull/58834) |
| `TestToolsModalPage.tsx`                   | 73         | `navigateAfterInteraction` call                                          | `Navigation.navigate(route, { waitForTransition: true })`                               | [#64717](https://github.com/Expensify/App/pull/64717) |
| `IOURequestStepConfirmation.tsx`           | 1390, 1396 | `navigateAfterInteraction` calls                                         | `Navigation.navigate(route, { waitForTransition: true })`                               | [#58422](https://github.com/Expensify/App/pull/58422) |
| `DiscardChangesConfirmation/index.tsx`     | 32, 62     | Toggle visibility after discard                                          | `Navigation.navigate(route, { waitForTransition: true })`                               | [#58422](https://github.com/Expensify/App/pull/58422) |
| `WorkspaceMemberDetailsPage.tsx`           | 170        | Go back after member action                                              | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#79597](https://github.com/Expensify/App/pull/79597) |
| `FloatingActionButtonAndPopover.tsx`       | 702        | FAB menu item action                                                     | `Navigation.navigate(route, { waitForTransition: true })`                               | [#56865](https://github.com/Expensify/App/pull/56865) |
| `Session/index.ts`                         | 1248       | Navigate after sign-in                                                   | `Navigation.navigate(route, { waitForTransition: true })`                               | [#30269](https://github.com/Expensify/App/pull/30269) |
| `Link.ts`                                  | 305        | Deep link navigation                                                     | `Navigation.navigate(route, { waitForTransition: true })`                               | [#74237](https://github.com/Expensify/App/pull/74237) |
| `Tour.ts`                                  | 9          | Tour navigation                                                          | `Navigation.navigate(route, { waitForTransition: true })`                               | [#67348](https://github.com/Expensify/App/pull/67348) |
| `TestDriveDemo.tsx`                        | 68, 76     | Set visibility / go back                                                 | `Navigation.goBack({ waitForTransition: true })`                                        | [#60085](https://github.com/Expensify/App/pull/60085) |
| `WorkspaceDowngradePage.tsx`               | 70, 84     | Navigate after downgrade                                                 | `Navigation.navigate/dismissModal({ waitForTransition: true })`                         | [#71333](https://github.com/Expensify/App/pull/71333) |
| `AccountDetailsPage.tsx`                   | 87         | Navigate after `useFocusEffect` triggers                                 | `Navigation.navigate(route, { waitForTransition: true })`                               | [#59911](https://github.com/Expensify/App/pull/59911) |
| `AccountDetailsPage.tsx`                   | 116        | Navigate after `useFocusEffect` triggers                                 | `Navigation.navigate(route, { waitForTransition: true })`                               | [#65834](https://github.com/Expensify/App/pull/65834) |
| `AccountValidatePage.tsx`                  | 128        | Navigate after `useFocusEffect` triggers                                 | `Navigation.navigate(route, { waitForTransition: true })`                               | [#79597](https://github.com/Expensify/App/pull/79597) |
| `IOURequestStepReport.tsx`                 | 156        | Report selection + navigate                                              | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#67048](https://github.com/Expensify/App/pull/67048) |
| `IOURequestStepReport.tsx`                 | 211        | Report selection + navigate                                              | `Navigation.goBack(route, { waitForTransition: true })`                                 | [#67925](https://github.com/Expensify/App/pull/67925) |
| `IOURequestStepScan/index.native.tsx`      | 374        | Scan step navigation                                                     | `Navigation.navigate(route, { waitForTransition: true })`                               | [#63451](https://github.com/Expensify/App/pull/63451) |
| `IOURequestStepScan/ReceiptView/index.tsx` | 70         | Receipt view navigation                                                  | `Navigation.navigate(route, { waitForTransition: true })`                               | [#63352](https://github.com/Expensify/App/pull/63352) |
| `IOURequestStepScan/index.tsx`             | 624        | Scan step navigation                                                     | `Navigation.navigate(route, { waitForTransition: true })`                               | [#63451](https://github.com/Expensify/App/pull/63451) |
| `SplitExpensePage.tsx`                     | 392        | Split expense navigation                                                 | `Navigation.navigate(route, { waitForTransition: true })`                               | [#79597](https://github.com/Expensify/App/pull/79597) |
| `IOURequestStepCategory.tsx`               | 210        | Category selection + keyboard dismiss                                    | `Navigation.navigate(route, { waitForTransition: true })`                               | [#53316](https://github.com/Expensify/App/pull/53316) |
| `IOURequestStepDestination.tsx`            | 201        | Keyboard dismiss + navigate                                              | `KeyboardUtils.dismiss({afterTransition: () => Navigation.goBack()})`                   | [#66747](https://github.com/Expensify/App/pull/66747) |
