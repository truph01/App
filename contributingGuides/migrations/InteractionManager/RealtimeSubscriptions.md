# Cluster 5: Realtime Subscriptions (~6 usages)

## Strategy

**Use `requestIdleCallback`**

Pusher subscriptions and typing event listeners are non-urgent background work. They should not block rendering or animations. `requestIdleCallback` schedules them during idle periods.

## Usages

| File                          | Line | Current                                    | Migration                                                       | PR                                                    |
| ----------------------------- | ---- | ------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------- |
| `Pusher/index.ts`             | 206  | InteractionManager wrapping subscribe call | Replace with `requestIdleCallback(() => subscribe())`           | [#53751](https://github.com/Expensify/App/pull/53751) |
| `Pusher/index.native.ts`     | 211  | InteractionManager wrapping subscribe call | Replace with `requestIdleCallback(() => subscribe())`           | [#56610](https://github.com/Expensify/App/pull/56610) |
| `UserTypingEventListener.tsx` | 35   | InteractionManager wrapping unsubscribe    | Replace with `requestIdleCallback(() => unsubscribe())`         | [#47780](https://github.com/Expensify/App/pull/47780) |
| `UserTypingEventListener.tsx` | 49   | Store ref for InteractionManager handle    | Update to store `requestIdleCallback` handle ref                | [#47780](https://github.com/Expensify/App/pull/47780) |
| `UserTypingEventListener.tsx` | 59   | InteractionManager wrapping subscribe      | Replace with `requestIdleCallback(() => subscribe())`           | [#47780](https://github.com/Expensify/App/pull/47780) |
| `UserTypingEventListener.tsx` | 70   | InteractionManager wrapping unsubscribe    | Replace with `requestIdleCallback(() => unsubscribe())`         | [#47780](https://github.com/Expensify/App/pull/47780) |
