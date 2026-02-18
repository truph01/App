# InteractionManager Migration Guide

## Why we're migrating away from `InteractionManager.runAfterInteractions`

`runAfterInteractions` conflates three different needs into one global queue:

1. "Wait for this navigation transition to finish"
2. "Yield to the UI thread for one frame"
3. "Defer non-urgent background work"

Each need has a better, more precise primitive. This guide explains the replacements.

---

## Primitives comparison

### `requestAnimationFrame` (rAF)

- Fires **before the next paint** (~16ms at 60fps)
- Guaranteed to run every frame if the thread isn't blocked
- Use for: UI updates that need to happen on the next frame (scroll, layout measurement, enabling a button after a state flush)

### `requestIdleCallback`

- Fires when the runtime has **idle time** — no pending frames, no urgent work
- May be delayed indefinitely if the main thread stays busy
- Accepts a `timeout` option to force execution after a deadline
- Use for: Non-urgent background work (Pusher subscriptions, search API calls, contact imports)

### `InteractionManager.runAfterInteractions` (legacy — do not use)

- React Native-specific. Fires after all **ongoing interactions** (animations, touches) complete
- Tracks interactions via `createInteractionHandle()` — anything that calls `handle.done()` unblocks the queue
- In practice, this means "run after the current navigation transition finishes"
- Problem: it's a global queue with no granularity — you can't say "after _this specific_ transition"

### Summary

|                        | Timing                    | Granularity               | Platform              |
| ---------------------- | ------------------------- | ------------------------- | --------------------- |
| `rAF`                  | Next frame (~16ms)        | None — just "next paint"  | Web + RN              |
| `requestIdleCallback`  | When idle (unpredictable) | None — "whenever free"    | Web + RN (polyfilled) |
| `runAfterInteractions` | After animations finish   | Global — all interactions | RN only               |
