# TransitionTracker Direct Usage (~5 usages)

## Strategy

**Use `TransitionTracker.runAfterTransitions` (direct usage in utilities/infra code only)**

These are infrastructure-level usages where `TransitionTracker.runAfterTransitions` should be called directly. This is the exception to the general rule — application code should use `Navigation.afterTransition` or `KeyboardUtils.dismiss({afterTransition})` instead, but these utility/infrastructure files need the direct API.

## Usages

| File                                 | Line | Current                                       | Migration                                  | PR                                                    |
| ------------------------------------ | ---- | --------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `Performance.tsx`                    | 49   | InteractionManager wrapping TTI measurement   | Use `TransitionTracker.runAfterTransitions` | [#54412](https://github.com/Expensify/App/pull/54412) |
| `Lottie/index.tsx`                   | 44   | InteractionManager gating Lottie rendering    | Use `TransitionTracker.runAfterTransitions` | [#48143](https://github.com/Expensify/App/pull/48143) |
| `BackgroundImage/index.native.tsx`   | 38   | InteractionManager deferring background load  | Use `TransitionTracker.runAfterTransitions` | [#48143](https://github.com/Expensify/App/pull/48143) |
| `BackgroundImage/index.tsx`          | 38   | InteractionManager deferring background load  | Use `TransitionTracker.runAfterTransitions` | [#48143](https://github.com/Expensify/App/pull/48143) |
| `TopLevelNavigationTabBar/index.tsx` | 54   | InteractionManager detecting animation finish | Use `TransitionTracker.runAfterTransitions` | [#49539](https://github.com/Expensify/App/pull/49539) |
