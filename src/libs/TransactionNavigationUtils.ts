import type {OnyxInputOrEntry, ReportAction} from '@src/types/onyx';
import CONST from '@src/CONST';
import {isDeletedAction} from './ReportActionsUtils';

type ParentReportActionDeletionStatusParams = {
    hasLoadedParentReportActions: boolean;
    parentReportAction: OnyxInputOrEntry<ReportAction>;
    parentReportActionID?: string;
    parentReportID?: string;
    shouldRequireParentReportActionID?: boolean;
    shouldTreatMissingParentReportAsDeleted?: boolean;
};

function decodeDeleteNavigateBackUrl(url: string): string {
    try {
        return decodeURIComponent(url);
    } catch {
        return url;
    }
}

function doesDeleteNavigateBackUrlIncludeDuplicatesReview(url?: string): boolean {
    if (!url) {
        return false;
    }
    return decodeDeleteNavigateBackUrl(url).includes('/duplicates/review');
}

function doesDeleteNavigateBackUrlIncludeSpecificDuplicatesReview(url?: string, threadReportID?: string): boolean {
    if (!threadReportID) {
        return false;
    }
    const decodedDeleteNavigateBackUrl = decodeDeleteNavigateBackUrl(url ?? '');
    return decodedDeleteNavigateBackUrl.includes('/duplicates/review') && decodedDeleteNavigateBackUrl.includes(threadReportID);
}

function getParentReportActionDeletionStatus({
    hasLoadedParentReportActions,
    parentReportAction,
    parentReportActionID,
    parentReportID,
    shouldRequireParentReportActionID = true,
    shouldTreatMissingParentReportAsDeleted = false,
}: ParentReportActionDeletionStatusParams) {
    const canUseParentActionIDForMissingCheck = !shouldRequireParentReportActionID || !!parentReportActionID;
    const isParentActionMissingAfterLoad = !!parentReportID && canUseParentActionIDForMissingCheck && hasLoadedParentReportActions && !parentReportAction;
    const isParentActionDeleted =
        !!parentReportAction && (parentReportAction.pendingAction === CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE || isDeletedAction(parentReportAction));
    const isMissingParentReport = shouldTreatMissingParentReportAsDeleted && !parentReportID && !parentReportAction?.reportActionID;
    const wasParentActionDeleted = isParentActionDeleted || isParentActionMissingAfterLoad || isMissingParentReport;

    return {isParentActionMissingAfterLoad, isParentActionDeleted, wasParentActionDeleted};
}

export {doesDeleteNavigateBackUrlIncludeDuplicatesReview, doesDeleteNavigateBackUrlIncludeSpecificDuplicatesReview, getParentReportActionDeletionStatus};
