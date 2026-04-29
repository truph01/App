import {useEffect, useRef} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {applyPendingConciergeAction, discardPendingConciergeAction} from '@libs/actions/Report/SuggestedFollowup';
import Log from '@libs/Log';
import {rand64} from '@libs/NumberUtils';
import type {ConciergeDraftEvent} from '@libs/Pusher/types';
import tokenizeForReveal from '@libs/ReportActionFollowupUtils/tokenizeForReveal';
import {getReportActionHtml} from '@libs/ReportActionsUtils';
import {useConciergeDraftActions} from '@pages/inbox/ConciergeDraftContext';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ReportAction, ReportActions} from '@src/types/onyx';
import useOnyx from './useOnyx';

/** If displayAfter is more than this far in the past, the response is stale (e.g. app was killed and restarted). */
const STALE_THRESHOLD_MS = 10_000;
/** Default trickle duration. Targets ~19 chars/sec start (~7/sec end after ease-out) across a typical multi-paragraph response — visibly streaming without dragging the user past the moment they want to read. */
const DEFAULT_STREAM_DURATION_MS = 15_000;
/** Trickle tick cadence. 80ms targets ~1 char per tick at char-level granularity — fast enough that the reveal feels continuous, slow enough that the synthetic-bubble re-render budget stays comfortable on RNW (~12 dispatches/sec). */
const TICK_INTERVAL_MS = 80;
/** Hard cap on running trickle. If the loop is still alive past this, force completion to avoid pinning a synthetic bubble forever. */
const TRICKLE_HARD_CAP_MS = 60_000;
/** Once the real reportComment lands in REPORT_ACTIONS, finish the remaining reveal within this window. */
const ACCELERATED_REMAINING_MS = 1_500;

function easeOut(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - (1 - clamped) ** 2;
}

/**
 * Long Concierge replies trickle into `ConciergeDraftContext`; short ones keep
 * the binary reveal at `displayAfter`. `REPORT_ACTIONS` is written at completion.
 */
function usePendingConciergeResponse(reportID: string | undefined) {
    const [pendingResponse] = useOnyx(`${ONYXKEYS.COLLECTION.PENDING_CONCIERGE_RESPONSE}${reportID}`);
    const reportActionID = pendingResponse?.reportAction?.reportActionID;
    const fullHtml = pendingResponse?.reportAction ? getReportActionHtml(pendingResponse.reportAction) : '';
    // React Compiler auto-memoizes the selector closure and the tokenize result;
    // explicit useCallback/useMemo would just shadow the compiler's analysis.
    const persistedActionSelector = (actions: OnyxEntry<ReportActions>): ReportAction | undefined => (reportActionID && actions ? actions[reportActionID] : undefined);
    const [persistedAction] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${reportID}`, {selector: persistedActionSelector});
    const {dispatchLocalDraftEvent} = useConciergeDraftActions();

    const tokens = tokenizeForReveal(fullHtml);
    const accelerateRef = useRef<((nowMs: number) => void) | null>(null);

    // Reconciliation: when the canonical reportComment lands in REPORT_ACTIONS
    // mid-trickle, fire the running loop's accelerator so the remaining reveal
    // finishes in ~1.5s instead of snapping the synthetic bubble closed.
    useEffect(() => {
        if (!persistedAction || !accelerateRef.current) {
            return;
        }
        accelerateRef.current(Date.now());
    }, [persistedAction]);

    useEffect(() => {
        if (!pendingResponse || !reportID || !reportActionID) {
            return;
        }
        const {reportAction, displayAfter} = pendingResponse;
        const remainingDelay = displayAfter - Date.now();

        if (remainingDelay < -STALE_THRESHOLD_MS) {
            discardPendingConciergeAction(reportID);
            return;
        }

        // Anchors are character-level. Short replies (~50–100 chars) keep the
        // binary reveal; longer ones (paragraphs / lists) cross the threshold
        // and get the smooth trickle.
        const shouldTrickle = tokens.length >= 100 && !!fullHtml;
        if (!shouldTrickle) {
            const timer = setTimeout(() => applyPendingConciergeAction(reportID, reportAction), Math.max(0, remainingDelay));
            return () => clearTimeout(timer);
        }

        const session = rand64();
        let sequence = 0;
        let intervalID: ReturnType<typeof setInterval> | null = null;
        let trickleStart = 0;
        let effectiveDuration = DEFAULT_STREAM_DURATION_MS;
        let lastStage = 0;
        let cancelled = false;
        // Snapshot of trickle progress at the moment the canonical reportComment
        // arrives. Presence (`arrival !== undefined`) doubles as the
        // "acceleration fired" check that selects the completion reason below.
        let arrival: {progress: number; elapsedMs: number} | undefined;

        const dispatch = (status: ConciergeDraftEvent['status'], finalRenderedHTML: string) => {
            if (cancelled) {
                return;
            }
            sequence += 1;
            dispatchLocalDraftEvent({
                reportID,
                reportActionID,
                streamSessionID: session,
                sequence,
                status,
                created: reportAction.created,
                finalRenderedHTML,
            });
        };

        const completeAndApply = () => {
            if (intervalID) {
                clearInterval(intervalID);
                intervalID = null;
            }
            const totalElapsedMs = trickleStart === 0 ? 0 : Date.now() - trickleStart;
            let reason: 'natural' | 'accelerated' | 'stale_cap' = 'natural';
            if (arrival) {
                reason = 'accelerated';
            } else if (totalElapsedMs >= TRICKLE_HARD_CAP_MS) {
                reason = 'stale_cap';
            }
            Log.info('[ConciergeTrickle] complete', false, {
                reportActionID,
                reason,
                tokenCount: tokens.length,
                durationMs: effectiveDuration,
                totalElapsedMs,
                arrivedAtProgress: arrival?.progress,
                arrivedAtElapsedMs: arrival?.elapsedMs,
            });
            dispatch('completed', tokens.at(-1) ?? fullHtml);
            // If acceleration fired, the canonical reportComment already landed in
            // REPORT_ACTIONS. Re-applying our older optimistic payload would clobber
            // server-added markup (e.g. follow-up buttons) until the next server
            // update. Just clear the pending state in that case — the synthetic
            // bubble fades into the canonical row.
            if (arrival) {
                discardPendingConciergeAction(reportID);
            } else {
                applyPendingConciergeAction(reportID, reportAction);
            }
        };

        accelerateRef.current = (nowMs: number) => {
            if (!intervalID || trickleStart === 0) {
                return;
            }
            const elapsed = nowMs - trickleStart;
            // Compressing effectiveDuration is what makes progress hit 1 within
            // ACCELERATED_REMAINING_MS — the next tick observes progress >= 1
            // and runs completeAndApply via the normal path.
            arrival = {progress: easeOut(elapsed / effectiveDuration), elapsedMs: elapsed};
            effectiveDuration = elapsed + ACCELERATED_REMAINING_MS;
        };

        const startTrickle = () => {
            if (cancelled) {
                return;
            }
            trickleStart = Date.now();
            Log.info('[ConciergeTrickle] start', false, {
                reportActionID,
                tokenCount: tokens.length,
                durationMs: effectiveDuration,
            });
            dispatch('started', tokens.at(1) ?? '');
            lastStage = 1;
            const lastIndex = tokens.length - 1;
            intervalID = setInterval(() => {
                const elapsed = Date.now() - trickleStart;
                const progress = easeOut(elapsed / effectiveDuration);
                // progress ∈ [0,1] (easeOut clamps) and lastIndex ≥ 99 (shouldTrickle gate),
                // so `progress * lastIndex` is always non-negative — only the upper bound needs clamping.
                const stage = Math.min(lastIndex, Math.ceil(progress * lastIndex));
                if (stage > lastStage) {
                    lastStage = stage;
                    dispatch('updated', tokens.at(stage) ?? '');
                }
                if (progress >= 1 || elapsed >= TRICKLE_HARD_CAP_MS) {
                    completeAndApply();
                }
            }, TICK_INTERVAL_MS);
        };

        const startTimer = setTimeout(startTrickle, Math.max(0, remainingDelay));
        return () => {
            cancelled = true;
            clearTimeout(startTimer);
            if (intervalID) {
                clearInterval(intervalID);
            }
            accelerateRef.current = null;
        };
    }, [pendingResponse, reportID, reportActionID, fullHtml, tokens, dispatchLocalDraftEvent]);
}

export default usePendingConciergeResponse;
