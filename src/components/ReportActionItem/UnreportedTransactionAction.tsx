import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import Parser from '@libs/Parser';
import {getOriginalMessage} from '@libs/ReportActionsUtils';
import {getUnreportedTransactionMessage} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ReportAction} from '@src/types/onyx';
import ReportActionItemBasicMessage from '@pages/inbox/report/ReportActionItemBasicMessage';
import RenderHTML from '@components/RenderHTML';

type UnreportedTransactionActionProps = {
    action: ReportAction<typeof CONST.REPORT.ACTIONS.TYPE.UNREPORTED_TRANSACTION>;
};

function UnreportedTransactionAction({action}: UnreportedTransactionActionProps) {
    const unreportedTransactionOriginalMessage = getOriginalMessage(action);
    const fromReportID = unreportedTransactionOriginalMessage?.fromReportID;

    const {translate} = useLocalize();
    const [fromReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${fromReportID}`, {canBeMissing: true});

    const isPendingDelete = fromReport?.pendingFields?.preview === CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE;
    const hasUnreportedTransaction = getUnreportedTransactionMessage(translate, action);
    const htmlContent = isPendingDelete
        ? `<del><comment><muted-text>${Parser.htmlToText(hasUnreportedTransaction)}</muted-text></comment></del>`
        : `<comment><muted-text>${getUnreportedTransactionMessage(translate, action)}</muted-text></comment>`;

    return (
        <ReportActionItemBasicMessage message="">
            <RenderHTML html={htmlContent} />
        </ReportActionItemBasicMessage>
    );
}

export default UnreportedTransactionAction;
