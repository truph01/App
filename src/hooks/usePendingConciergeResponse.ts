import {useEffect} from 'react';
import Onyx from 'react-native-onyx';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import useOnyx from './useOnyx';

/**
 * Processes pending concierge responses stored in Onyx for a given report.
 * When a pending response exists, schedules the action to be moved to REPORT_ACTIONS
 * after the remaining delay, with automatic cleanup on unmount via useEffect.
 *
 * This keeps the action layer free of timers — all scheduling state lives in Onyx
 * and the delay is managed by React component lifecycle.
 */
function usePendingConciergeResponse(reportID: string) {
    const [pendingResponse] = useOnyx(`${ONYXKEYS.COLLECTION.PENDING_CONCIERGE_RESPONSE}${reportID}`, {canBeMissing: true});

    useEffect(() => {
        if (!pendingResponse) {
            return;
        }

        const remaining = Math.max(0, pendingResponse.displayAfter - Date.now());

        const timer = setTimeout(() => {
            Onyx.update([
                // Clear the pending response
                {
                    onyxMethod: Onyx.METHOD.SET,
                    key: `${ONYXKEYS.COLLECTION.PENDING_CONCIERGE_RESPONSE}${reportID}`,
                    value: null,
                },
                // Clear the typing indicator
                {
                    onyxMethod: Onyx.METHOD.MERGE,
                    key: `${ONYXKEYS.COLLECTION.REPORT_USER_IS_TYPING}${reportID}`,
                    value: {[CONST.ACCOUNT_ID.CONCIERGE]: false},
                },
                // Add the concierge action to report actions
                {
                    onyxMethod: Onyx.METHOD.MERGE,
                    key: `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${reportID}`,
                    value: {[pendingResponse.reportAction.reportActionID]: pendingResponse.reportAction},
                },
            ]);
        }, remaining);

        return () => clearTimeout(timer);
    }, [pendingResponse, reportID]);
}

export default usePendingConciergeResponse;
