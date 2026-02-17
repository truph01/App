# Cluster 3: Input Focus Management (~16 usages)

## Strategy

**Skip for now — focus utilities not coded yet**

Document each usage but mark as TODO. When the focus utility is implemented, it should follow the same pattern as keyboard (`TransitionTracker` called internally, expose `afterTransition` option).

`TransitionTracker.runAfterTransitions()` should **never** be called directly in application code.

## Usages

| File                                         | Line | Description                                | PR                                                     |
| -------------------------------------------- | ---- | ------------------------------------------ | ------------------------------------------------------ |
| `InputFocus/index.website.ts`                | 25   | Focus composer after modal                 | [#60073](https://github.com/Expensify/App/pull/60073)  |
| `focusEditAfterCancelDelete/index.native.ts` | 6    | Focus text input after cancel/delete       | [#47780](https://github.com/Expensify/App/pull/47780)  |
| `useRestoreInputFocus/index.android.ts`      | 15   | `KeyboardController.setFocusTo('current')` | [#54187](https://github.com/Expensify/App/pull/54187)  |
| `useAutoFocusInput.ts`                       | 37   | Auto-focus input after interactions        | [#47780](https://github.com/Expensify/App/pull/47780)  |
| `FormProvider.tsx`                           | 427  | Set blur state in Safari                   | [#55494](https://github.com/Expensify/App/pull/55494)  |
| `ContactPermissionModal/index.native.tsx`    | 41   | Permission + focus after modal             | [#54459](https://github.com/Expensify/App/pull/54459)  |
| `ContactPermissionModal/index.native.tsx`    | 59   | Permission + focus after modal             | [#64207](https://github.com/Expensify/App/pull/64207)  |
| `SearchRouter.tsx`                           | 346  | Focus search input after route             | [#65183](https://github.com/Expensify/App/pull/65183)  |
| `ShareRootPage.tsx`                          | 162  | Focus input after tab animation            | [#63741](https://github.com/Expensify/App/pull/63741)  |
| `EmojiPickerMenu/index.native.tsx`           | 51   | Focus emoji search input                   | [#52009](https://github.com/Expensify/App/pull/52009)  |
| `ReportActionItemMessageEdit.tsx`            | 291  | Focus composer                             | [#28238](https://github.com/Expensify/App/pull/28238)  |
| `ReportActionItemMessageEdit.tsx`            | 545  | Focus composer                             | [#42965](https://github.com/Expensify/App/pull/42965)  |
| `ComposerWithSuggestions.tsx`                | 594  | Focus composer                             | [#74921](https://github.com/Expensify/App/pull/74921)  |
| `MoneyRequestConfirmationList.tsx`           | 1071 | `blurActiveElement()` after confirm        | [#45873](https://github.com/Expensify/App/pull/45873)  |
| `SplitListItem.tsx`                          | 75   | Focus input after screen transition        | [#77657](https://github.com/Expensify/App/pull/77657)  |
| `ContactMethodDetailsPage.tsx`               | 215  | Focus after modal hide                     | [#54784](https://github.com/Expensify/App/pull/54784)  |
| `ContactMethodDetailsPage.tsx`               | 279  | Focus on entry transition end              | [#55588](https://github.com/Expensify/App/pull/55588)  |
