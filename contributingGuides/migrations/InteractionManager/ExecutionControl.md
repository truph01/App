# Cluster 7: Execution Control (~3 usages)

## Strategy

**Case-by-case**

These usages control execution timing for UI state resets and navigation animation detection. Each requires a different primitive.

## Usages

| File                                 | Line | Current                                       | Migration                                                                                                                                                                                            | PR                                                    |
| ------------------------------------ | ---- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `useSingleExecution/index.native.ts` | 27   | InteractionManager resetting `isExecuting`    | Replace with `requestAnimationFrame(() => setIsExecuting(false))` — this just needs to yield to allow UI updates before resetting state, if it doesnt work use TransitionTracker.runAfterTransitions | [#47780](https://github.com/Expensify/App/pull/47780) |
| `TopLevelNavigationTabBar/index.tsx` | 54   | InteractionManager detecting animation finish | use TransitionTracker.runAfterTransitions                                                                                                                                                            | [#49539](https://github.com/Expensify/App/pull/49539) |
