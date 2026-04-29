import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useDelegateAccountID from '@hooks/useDelegateAccountID';
import useIsInSidePanel from '@hooks/useIsInSidePanel';
import useOnyx from '@hooks/useOnyx';
import useOpenConciergeAnywhere from '@hooks/useOpenConciergeAnywhere';
import getNonEmptyStringOnyxID from '@libs/getNonEmptyStringOnyxID';
import {addComment} from '@userActions/Report';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

/**
 * Returns a callback that opens Concierge (side panel on web, chat on native)
 * and sends the provided search query as a message.
 */
function useAskConcierge() {
    const [conciergeReportID] = useOnyx(ONYXKEYS.CONCIERGE_REPORT_ID);
    const [conciergeReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${getNonEmptyStringOnyxID(conciergeReportID)}`);
    const {timezone, accountID: currentUserAccountID} = useCurrentUserPersonalDetails();
    const openConciergeAnywhere = useOpenConciergeAnywhere();
    const delegateAccountID = useDelegateAccountID();
    const isInSidePanel = useIsInSidePanel();

    return (searchQuery: string) => {
        openConciergeAnywhere();
        if (!conciergeReport || !conciergeReportID) {
            return;
        }
        addComment({
            report: conciergeReport,
            notifyReportID: conciergeReportID,
            ancestors: [],
            text: searchQuery,
            timezoneParam: timezone ?? CONST.DEFAULT_TIME_ZONE,
            currentUserAccountID,
            shouldPlaySound: true,
            isInSidePanel,
            delegateAccountID,
        });
    };
}

export default useAskConcierge;
