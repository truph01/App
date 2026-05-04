import React from 'react';
import useOnyx from '@hooks/useOnyx';
import ConciergeThinkingMessage from '@pages/home/report/ConciergeThinkingMessage';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ListBoundaryLoader from './ListBoundaryLoader';

type ReportActionsListHeaderProps = {
    /** The ID of the report being displayed */
    reportID: string;

    /** Whether to hide the Concierge thinking message */
    shouldHideConciergeThinkingMessage?: boolean;

    /** Callback to retry loading newer chats after an error */
    onRetry: () => void;
};

function ReportActionsListHeader({reportID, shouldHideConciergeThinkingMessage = false, onRetry}: ReportActionsListHeaderProps) {
    const [report] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${reportID}`);

    return (
        <>
            {!shouldHideConciergeThinkingMessage && <ConciergeThinkingMessage report={report} />}
            <ListBoundaryLoader
                type={CONST.LIST_COMPONENTS.HEADER}
                onRetry={onRetry}
            />
        </>
    );
}

export default ReportActionsListHeader;
