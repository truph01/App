# Onboarding Tours (~3 usages)

## Strategy

**Use `Navigation.navigate({afterTransition})`**

All onboarding usages defer navigation to the next onboarding step until after the current screen transition completes. Replace with the `afterTransition` option on `Navigation.navigate`.

## Usages

| File                                   | Line | Current                                              | Migration                                                        | PR                                                    |
| -------------------------------------- | ---- | ---------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `useOnboardingFlow.ts`                 | 58   | InteractionManager deferring onboarding start        | Use TransitionTracker.runAfterTransitions                        | [#77874](https://github.com/Expensify/App/pull/77874) |
| `BaseOnboardingInterestedFeatures.tsx` | 217  | InteractionManager deferring feature step navigation | Add afterTransition to navigateAfterOnboardingWithMicrotaskQueue | [#79122](https://github.com/Expensify/App/pull/79122) |
