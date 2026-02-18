# Keyboard Dismiss After Transition (~7 usages)

## Strategy

**Use `KeyboardUtils.dismiss({afterTransition})`**

These usages dismiss the keyboard and then perform an action (usually navigation) after the keyboard close animation completes. Replace with `KeyboardUtils.dismiss({afterTransition: callback})`.

`TransitionTracker.runAfterTransitions()` should **never** be called directly — it is already wired into `KeyboardUtils` internally.

## Usages

| File                           | Line | Current                               | Migration                                                             | PR                                                    |
| ------------------------------ | ---- | ------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `IOURequestStepDestination.tsx` | 201  | Keyboard dismiss + navigate          | `KeyboardUtils.dismiss({afterTransition: () => Navigation.goBack()})` | [#66747](https://github.com/Expensify/App/pull/66747) |
| `IOURequestStepCategory.tsx`   | 210  | Category selection + keyboard dismiss | `KeyboardUtils.dismiss({afterTransition})`                            | [#53316](https://github.com/Expensify/App/pull/53316) |
| `IOURequestStepSubrate.tsx`    | 234  | Subrate selection + keyboard dismiss  | `KeyboardUtils.dismiss({afterTransition})`                            | [#56347](https://github.com/Expensify/App/pull/56347) |
| `IOURequestStepDescription.tsx` | 226  | Description submit + keyboard dismiss | `KeyboardUtils.dismiss({afterTransition})`                            | [#67010](https://github.com/Expensify/App/pull/67010) |
| `IOURequestStepMerchant.tsx`   | 181  | Merchant submit + keyboard dismiss    | `KeyboardUtils.dismiss({afterTransition})`                            | [#67010](https://github.com/Expensify/App/pull/67010) |
| `NewTaskPage.tsx`              | 63   | `blurActiveElement()` on focus        | `KeyboardUtils.dismiss({afterTransition})`                            | [#79597](https://github.com/Expensify/App/pull/79597) |
| `ContactMethodDetailsPage.tsx` | 130  | Open delete modal after keyboard dismiss | `KeyboardUtils.dismiss({afterTransition: () => setIsDeleteModalOpen(true)})` | [#35305](https://github.com/Expensify/App/pull/35305) |
