import type {OnyxEntry} from 'react-native-onyx';
import type {DropdownOption} from '@components/ButtonWithDropdownMenu/types';
import useLocalize from '@hooks/useLocalize';
import {hasInvoicingDetails} from '@userActions/Policy/Policy';
import type {IOUType} from '@src/CONST';
import type * as OnyxTypes from '@src/types/onyx';

type UseConfirmationCtaTextParams = {
    expensesNumber: number;
    isTypeInvoice: boolean;
    isTypeTrackExpense: boolean;
    isTypeSplit: boolean;
    isTypeRequest: boolean;
    iouAmount: number;
    iouType: IOUType;
    policy: OnyxEntry<OnyxTypes.Policy>;
    formattedAmount: string;
    receiptPath: string | number;
    isDistanceRequestWithPendingRoute: boolean;
    isPerDiemRequest: boolean;
    isNewManualExpenseFlowEnabled: boolean;
};

/**
 * Computes the primary confirm button label for the Money Request confirmation flow.
 *
 * Picks between create / create-with-amount / split / invoice / next variants based on
 * the IOU type, manual-expense-flow beta, bulk-expense count, and amount, returning a
 * single-entry DropdownOption array shaped for the ButtonWithDropdownMenu consumer.
 */
function useConfirmationCtaText({
    expensesNumber,
    isTypeInvoice,
    isTypeTrackExpense,
    isTypeSplit,
    isTypeRequest,
    iouAmount,
    iouType,
    policy,
    formattedAmount,
    receiptPath,
    isDistanceRequestWithPendingRoute,
    isPerDiemRequest,
    isNewManualExpenseFlowEnabled,
}: UseConfirmationCtaTextParams): Array<DropdownOption<string>> {
    const {translate} = useLocalize();

    let text;
    if (expensesNumber > 1) {
        text = translate('iou.createExpenses', expensesNumber);
    } else if (isTypeInvoice) {
        if (hasInvoicingDetails(policy)) {
            text = translate('iou.sendInvoice', formattedAmount);
        } else {
            text = translate('common.next');
        }
    } else if (isTypeTrackExpense) {
        text = translate('iou.createExpense');
        if (iouAmount !== 0 && !isNewManualExpenseFlowEnabled) {
            text = translate('iou.createExpenseWithAmount', {amount: formattedAmount});
        }
    } else if (isTypeSplit && iouAmount === 0) {
        text = translate('iou.splitExpense');
    } else if ((receiptPath && isTypeRequest) || isDistanceRequestWithPendingRoute || isPerDiemRequest) {
        text = translate('iou.createExpense');
        if (iouAmount !== 0 && !isNewManualExpenseFlowEnabled) {
            text = translate('iou.createExpenseWithAmount', {amount: formattedAmount});
        }
    } else if (isTypeSplit) {
        text = translate('iou.splitAmount', formattedAmount);
        if (isNewManualExpenseFlowEnabled) {
            text = translate('iou.splitExpense');
        }
    } else if (iouAmount === 0) {
        text = translate('iou.createExpense');
    } else if (isNewManualExpenseFlowEnabled) {
        text = translate('iou.createExpense');
    } else {
        text = translate('iou.createExpenseWithAmount', {amount: formattedAmount});
    }
    return [
        {
            text: text[0].toUpperCase() + text.slice(1),
            value: iouType,
        },
    ];
}

export default useConfirmationCtaText;
