import useOnyx from '@hooks/useOnyx';
import {getReportName} from '@libs/ReportNameUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import ReportActionItemBasicMessage from '@pages/inbox/report/ReportActionItemBasicMessage';
import RenderHTML from '@components/RenderHTML';
import useLocalize from '@hooks/useLocalize';
import {getCreatedReportForUnapprovedTransactionsMessage, getOriginalMessage} from '@libs/ReportActionsUtils';
import type {ReportAction} from '@src/types/onyx';
import type CONST from '@src/CONST';

type CreatedReportForUnapprovedTransactionsActionProps = {
    /** The report action when a report was created for unapproved transactions  */
    action: ReportAction<typeof CONST.REPORT.ACTIONS.TYPE.CREATED_REPORT_FOR_UNAPPROVED_TRANSACTIONS>;
};

function CreatedReportForUnapprovedTransactionsAction({action}: CreatedReportForUnapprovedTransactionsActionProps) {
    const {originalID} = getOriginalMessage(action) ?? {};
    const {translate} = useLocalize();
    const [report] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${originalID}`, {canBeMissing: true});
    const reportName = getReportName(report);
    const htmlContent = `<comment><muted-text>${getCreatedReportForUnapprovedTransactionsMessage(originalID, reportName, translate)}</muted-text></comment>`;

    return (
        <ReportActionItemBasicMessage>
            <RenderHTML html={htmlContent} />
        </ReportActionItemBasicMessage>
    );
}

export default CreatedReportForUnapprovedTransactionsAction;
