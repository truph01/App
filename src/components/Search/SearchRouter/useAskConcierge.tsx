import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useOnyx from '@hooks/useOnyx';
import useOpenConcierge from '@hooks/useOpenConcierge';
import {addComment} from '@userActions/Report';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

function useAskConcierge() {
    const [conciergeReportID] = useOnyx(ONYXKEYS.CONCIERGE_REPORT_ID);
    const [conciergeReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${conciergeReportID}`);
    const {timezone, accountID: currentUserAccountID} = useCurrentUserPersonalDetails();
    const openConcierge = useOpenConcierge();

    return (searchQuery: string) => {
        openConcierge();
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
            isInSidePanel: true,
        });
    };
}

export default useAskConcierge;
