import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import TransitionTracker from '@libs/Navigation/TransitionTracker';
import {getPendingSubmitFollowUpAction} from '@libs/telemetry/submitFollowUpAction';
import CONST from '@src/CONST';

/**
 * During dismiss_modal_and_open_report, defers heavy non-content components
 * (composer, invisible handlers) so the first render is lighter.
 * Real content (header + messages) still renders immediately.
 *
 * The deferral lifts once the navigation transition completes (plus one
 * animation frame for paint), with a safety timeout as a fallback.
 */
function useDeferNonEssentials(reportIDFromRoute: string | undefined): boolean {
    const [shouldDeferNonEssentials, setShouldDeferNonEssentials] = useState(() => {
        const pending = getPendingSubmitFollowUpAction();
        return pending?.followUpAction === CONST.TELEMETRY.SUBMIT_FOLLOW_UP_ACTION.DISMISS_MODAL_AND_OPEN_REPORT && pending?.reportID === reportIDFromRoute;
    });

    useFocusEffect(
        useCallback(() => {
            if (!shouldDeferNonEssentials) {
                return;
            }
            let animationFrameId: number;
            const handle = TransitionTracker.runAfterTransitions({
                callback: () => {
                    animationFrameId = requestAnimationFrame(() => setShouldDeferNonEssentials(false));
                },
                waitForUpcomingTransition: true,
            });
            // *3: shorter than the orchestrator's *5 because this only defers rendering
            // of non-essential components - the user already sees the report content.
            const safetyTimeout = setTimeout(() => setShouldDeferNonEssentials(false), CONST.MAX_TRANSITION_DURATION_MS * 3);
            return () => {
                handle.cancel();
                cancelAnimationFrame(animationFrameId);
                clearTimeout(safetyTimeout);
            };
        }, [shouldDeferNonEssentials]),
    );

    return shouldDeferNonEssentials;
}

export default useDeferNonEssentials;
