import type {OnyxEntry} from 'react-native-onyx';
import {useProductTrainingContext} from '@components/ProductTrainingContext';
import usePermissions from '@hooks/usePermissions';
import {isSelectedManagerMcTest} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import type * as OnyxTypes from '@src/types/onyx';
import type {Participant} from '@src/types/onyx/IOU';

type UseReceiptTrainingParams = {
    transaction: OnyxEntry<OnyxTypes.Transaction>;
    selectedParticipantsProp: Participant[];
};

/**
 * Detects which product-training flow (test-receipt, test-drive, Manager McTest) the
 * current confirmation belongs to and surfaces the tooltip state for the confirm
 * button.
 *
 * Also returns `isTestReceipt` so callers can gate unrelated UI (e.g. the participant
 * edit affordance) on whether this is a test receipt.
 */
function useReceiptTraining({transaction, selectedParticipantsProp}: UseReceiptTrainingParams) {
    const {isBetaEnabled} = usePermissions();

    const isTestReceipt = transaction?.receipt?.isTestReceipt ?? false;
    const isTestDriveReceipt = transaction?.receipt?.isTestDriveReceipt ?? false;
    const isManagerMcTestReceipt = isBetaEnabled(CONST.BETAS.NEWDOT_MANAGER_MCTEST) && selectedParticipantsProp.some((participant) => isSelectedManagerMcTest(participant.login));

    const {shouldShowProductTrainingTooltip, renderProductTrainingTooltip} = useProductTrainingContext(
        isTestDriveReceipt ? CONST.PRODUCT_TRAINING_TOOLTIP_NAMES.SCAN_TEST_DRIVE_CONFIRMATION : CONST.PRODUCT_TRAINING_TOOLTIP_NAMES.SCAN_TEST_CONFIRMATION,
        isTestDriveReceipt || isManagerMcTestReceipt,
    );

    return {isTestReceipt, shouldShowProductTrainingTooltip, renderProductTrainingTooltip};
}

export default useReceiptTraining;
