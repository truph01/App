import {hasSeenTourSelector} from '@selectors/Onboarding';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useOnyx from '@hooks/useOnyx';
import {navigateToConciergeChat} from '@userActions/Report';
import ONYXKEYS from '@src/ONYXKEYS';

/**
 * Returns a callback that navigates to the Concierge chat on native (opens the side panel on web instead).
 */
function useOpenConciergeAnywhere() {
    const [conciergeReportID] = useOnyx(ONYXKEYS.CONCIERGE_REPORT_ID);
    const [introSelected] = useOnyx(ONYXKEYS.NVP_INTRO_SELECTED);
    const [betas] = useOnyx(ONYXKEYS.BETAS);
    const [isSelfTourViewed] = useOnyx(ONYXKEYS.NVP_ONBOARDING, {selector: hasSeenTourSelector});
    const {accountID: currentUserAccountID} = useCurrentUserPersonalDetails();

    return () => {
        navigateToConciergeChat(conciergeReportID, introSelected, currentUserAccountID, isSelfTourViewed, betas);
    };
}

export default useOpenConciergeAnywhere;
