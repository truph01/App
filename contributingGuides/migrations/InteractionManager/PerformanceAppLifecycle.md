# Cluster 6: Performance / App Lifecycle (~6 usages)

## Strategy

**Use `TransitionTracker.runAfterTransitions`**

Performance measurements, splash screen timing, Lottie animation gating, and background image loading are all non-urgent work that should not block the main thread during transitions. 

## Usages

| File                               | Line | Current                                      | Migration                                 | PR                                                    |
| ---------------------------------- | ---- | -------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `Performance.tsx`                  | 49   | InteractionManager wrapping TTI measurement  | use TransitionTracker.runAfterTransitions | [#54412](https://github.com/Expensify/App/pull/54412) |
| `Lottie/index.tsx`                 | 44   | InteractionManager gating Lottie rendering   | use TransitionTracker.runAfterTransitions | [#48143](https://github.com/Expensify/App/pull/48143) |
| `BackgroundImage/index.native.tsx` | 38   | InteractionManager deferring background load | use TransitionTracker.runAfterTransitions | [#48143](https://github.com/Expensify/App/pull/48143) |
| `BackgroundImage/index.tsx`        | 38   | InteractionManager deferring background load | use TransitionTracker.runAfterTransitions | [#48143](https://github.com/Expensify/App/pull/48143) |
