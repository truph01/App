# Onboarding Tours 

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

Onboarding usages defer navigation to the next onboarding step until after the current screen transition completes.

## Usages

| File                                   | Line | Current                                              | Migration                                                        | PR                                                    |
| -------------------------------------- | ---- | ---------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `useOnboardingFlow.ts`                 | 58   | InteractionManager deferring onboarding start        | Use TransitionTracker.runAfterTransitions                        | [#77874](https://github.com/Expensify/App/pull/77874) |
| `BaseOnboardingInterestedFeatures.tsx` | 217  | InteractionManager deferring feature step navigation | Add afterTransition to navigateAfterOnboardingWithMicrotaskQueue | [#79122](https://github.com/Expensify/App/pull/79122) |
