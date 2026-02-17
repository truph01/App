type CancelHandle = {cancel: () => void};

type TransitionType = 'keyboard' | 'navigation' | 'modal' | 'focus';

type PendingEntry = {callback: () => void; type?: TransitionType};

const MAX_TRANSITION_DURATION_MS = 1000;

const activeTransitions = new Map<TransitionType, number>();

const activeTimeouts: Array<{type: TransitionType; timeout: ReturnType<typeof setTimeout>}> = [];

let pendingCallbacks: PendingEntry[] = [];

/**
 * Invokes and removes pending callbacks.
 *
 * @param type - When provided, only flushes entries scoped to that type.
 *               When omitted, flushes all remaining entries.
 */
function flushCallbacks(type?: TransitionType): void {
    const remaining: PendingEntry[] = [];
    for (const entry of pendingCallbacks) {
        if (type === undefined || entry.type === type) {
            entry.callback();
        } else {
            remaining.push(entry);
        }
    }
    pendingCallbacks = remaining;
}

/**
 * Decrements the active count for the given transition type and flushes matching callbacks.
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

    // Flush callbacks scoped to this specific type
    flushCallbacks(type);

    // When all transitions end, flush remaining unscoped callbacks
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
 * When the count reaches zero, flushes callbacks scoped to that type.
 * When all transition types are idle, flushes remaining unscoped callbacks.
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
 * Schedules a callback to run after transitions complete. If no transitions are active
 * (or the specified type is idle), the callback fires on the next microtask.
 *
 * @param callback - The function to invoke once transitions finish.
 * @param type - Optional transition type to scope the wait. When provided, the callback
 *               fires as soon as that specific type finishes, even if other types are still active.
 *               When omitted, waits for all transition types to be idle.
 * @returns A handle with a `cancel` method to prevent the callback from firing.
 */
function runAfterTransitions(callback: () => void, type?: TransitionType): CancelHandle {
    const entry: PendingEntry = {callback, type};
    pendingCallbacks.push(entry);
    return {
        cancel: () => {
            const idx = pendingCallbacks.indexOf(entry);
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
};

export default TransitionTracker;
export type {TransitionType, CancelHandle};
