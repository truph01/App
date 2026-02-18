type CancelHandle = {cancel: () => void};

type TransitionType = 'keyboard' | 'navigation' | 'modal' | 'focus';

const MAX_TRANSITION_DURATION_MS = 1000;

const activeTransitions = new Map<TransitionType, number>();

const activeTimeouts: Array<{type: TransitionType; timeout: ReturnType<typeof setTimeout>}> = [];

let pendingCallbacks: Array<() => void> = [];

/**
 * Invokes and removes all pending callbacks.
 */
function flushCallbacks(): void {
    const callbacks = pendingCallbacks;
    pendingCallbacks = [];
    for (const callback of callbacks) {
        callback();
    }
}

/**
 * Decrements the active count for the given transition type and flushes callbacks when all transitions are idle.
 * Shared by {@link endTransition} (manual) and the auto-timeout.
 */
function decrementAndFlush(type: TransitionType): void {
    const current = activeTransitions.get(type) ?? 0;
    const next = Math.max(0, current - 1);

    if (next === 0) {
        activeTransitions.delete(type);
    } else {
        activeTransitions.set(type, next);
    }

    // When all transitions end, flush all pending callbacks
    if (activeTransitions.size === 0) {
        flushCallbacks();
    }
}

/**
 * Increments the active count for the given transition type.
 * Multiple overlapping transitions of the same type are counted.
 * Each transition automatically ends after {@link MAX_TRANSITION_DURATION_MS} as a safety net.
 */
function startTransition(type: TransitionType): void {
    const current = activeTransitions.get(type) ?? 0;
    activeTransitions.set(type, current + 1);

    const timeout = setTimeout(() => {
        const idx = activeTimeouts.findIndex((entry) => entry.timeout === timeout);
        if (idx !== -1) {
            activeTimeouts.splice(idx, 1);
        }
        decrementAndFlush(type);
    }, MAX_TRANSITION_DURATION_MS);

    activeTimeouts.push({type, timeout});
}

/**
 * Decrements the active count for the given transition type.
 * Clears the corresponding auto-timeout since the transition ended normally.
 * When all transition types are idle, flushes all pending callbacks.
 */
function endTransition(type: TransitionType): void {
    // Clear the oldest timeout for this type (FIFO order matches startTransition order)
    const timeoutIdx = activeTimeouts.findIndex((entry) => entry.type === type);
    if (timeoutIdx !== -1) {
        clearTimeout(activeTimeouts.at(timeoutIdx)?.timeout);
        activeTimeouts.splice(timeoutIdx, 1);
    }

    decrementAndFlush(type);
}

/**
 * Schedules a callback to run after all transitions complete. If no transitions are active
 * or `runImmediately` is true, the callback fires synchronously.
 *
 * @param callback - The function to invoke once transitions finish.
 * @param runImmediately - If true, the callback fires synchronously regardless of active transitions. Defaults to false.
 * @returns A handle with a `cancel` method to prevent the callback from firing.
 */
function runAfterTransitions(callback: () => void, runImmediately = false): CancelHandle {
    if (activeTransitions.size === 0 || runImmediately) {
        callback();
        return {cancel: () => {}};
    }

    pendingCallbacks.push(callback);

    return {
        cancel: () => {
            const idx = pendingCallbacks.indexOf(callback);
            if (idx !== -1) {
                pendingCallbacks.splice(idx, 1);
            }
        },
    };
}

const TransitionTracker = {
    startTransition,
    endTransition,
    runAfterTransitions,
    activeTransitions,
    pendingCallbacks,
};

export default TransitionTracker;
export type {TransitionType, CancelHandle};
