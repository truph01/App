import useOnyx from './useOnyx';
import getNonEmptyStringOnyxID from '@libs/getNonEmptyStringOnyxID';
import type {SearchOptionData} from '@libs/OptionsListUtils/types';
import ONYXKEYS from '@src/ONYXKEYS';

/**
 * For policy expense chat invitees, resolves the expense report and its associated chat report.
 */
export default function useUserToInviteReports(userToInvite: SearchOptionData | null | undefined) {
    const userToInviteReportID = userToInvite?.isPolicyExpenseChat ? userToInvite.reportID : undefined;
    const [userToInviteExpenseReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${getNonEmptyStringOnyxID(userToInviteReportID)}`, {canBeMissing: true});
    const [userToInviteChatReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${getNonEmptyStringOnyxID(userToInviteExpenseReport?.chatReportID)}`, {canBeMissing: true});

    return {userToInviteExpenseReport, userToInviteChatReport};
}
