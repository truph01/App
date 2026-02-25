import type {StartSpanOptions} from '@sentry/core';
import * as Sentry from '@sentry/react-native';
import Log from '@libs/Log';
import CONST from '@src/CONST';

type ActiveSpanEntry = {
    span: ReturnType<typeof Sentry.startInactiveSpan>;
    startTime: number;
};

const activeSpans = new Map<string, ActiveSpanEntry>();

type StartSpanExtraOptions = Partial<{
    /**
     * Minimum duration of the span in milliseconds. If the span is shorter than this duration, it will be discarded (filtered out) before sending to Sentry.
     *
     */
    minDuration: number;
}>;

function startSpan(spanId: string, options: StartSpanOptions, extraOptions: StartSpanExtraOptions = {}) {
    // End any existing span for this name
    cancelSpan(spanId);
    Log.info(`[Sentry][${spanId}] Starting span`, undefined, {
        spanId,
        spanOptions: options,
        spanExtraOptions: extraOptions,
        timestamp: Date.now(),
    });
    const span = Sentry.startInactiveSpan(options);
    const startTime = Date.now();

    if (extraOptions.minDuration) {
        span.setAttribute(CONST.TELEMETRY.ATTRIBUTE_MIN_DURATION, extraOptions.minDuration);
    }
    activeSpans.set(spanId, {span, startTime});

    return span;
}

function endSpan(spanId: string) {
    const entry = activeSpans.get(spanId);

    if (!entry) {
        Log.info(`[Sentry][${spanId}] Trying to end span but it does not exist`, undefined, {spanId, timestamp: Date.now()});
        return;
    }
    const now = Date.now();
    const durationMs = now - entry.startTime;
    Log.info(`[Sentry][${spanId}] Ending span (${durationMs}ms)`, undefined, {spanId, durationMs, timestamp: now});
    entry.span.setStatus({code: 1});
    entry.span.setAttribute(CONST.TELEMETRY.ATTRIBUTE_FINISHED_MANUALLY, true);
    entry.span.end();
    activeSpans.delete(spanId);
}

function cancelSpan(spanId: string) {
    const entry = activeSpans.get(spanId);
    if (!entry) {
        return;
    }
    Log.info(`[Sentry][${spanId}] Canceling span`, undefined, {spanId, timestamp: Date.now()});
    entry.span.setAttribute(CONST.TELEMETRY.ATTRIBUTE_CANCELED, true);
    // In Sentry there are only OK or ERROR status codes.
    // We treat canceled spans as OK, so we can properly track spans that are not finished at all (their status would be different)
    entry.span.setStatus({code: 1});
    endSpan(spanId);
}

function cancelAllSpans() {
    for (const [spanId] of activeSpans.entries()) {
        cancelSpan(spanId);
    }
}

function cancelSpansByPrefix(prefix: string) {
    for (const [spanID] of activeSpans.entries()) {
        if (spanID.startsWith(prefix)) {
            cancelSpan(spanID);
        }
    }
}

function getSpan(spanId: string) {
    return activeSpans.get(spanId)?.span;
}

export {startSpan, endSpan, getSpan, cancelSpan, cancelAllSpans, cancelSpansByPrefix};
