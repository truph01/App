import type {OnyxEntry} from 'react-native-onyx';
import {useCurrencyListActions} from '@hooks/useCurrencyList';
import useLocalize from '@hooks/useLocalize';
import {computePerDiemExpenseAmount} from '@libs/actions/IOU/PerDiem';
import type {getAttendees} from '@libs/TransactionUtils';
import {isScanning, isScanRequest as isScanRequestUtil} from '@libs/TransactionUtils';
import type * as OnyxTypes from '@src/types/onyx';

type SubRates = NonNullable<NonNullable<NonNullable<OnyxTypes.Transaction['comment']>['customUnit']>['subRates']>;

type UseConfirmationAmountParams = {
    transaction: OnyxEntry<OnyxTypes.Transaction>;
    iouAmount: number;
    iouCurrencyCode: string | undefined;
    iouAttendees: ReturnType<typeof getAttendees>;
    isDistanceRequest: boolean;
    isDistanceRequestWithPendingRoute: boolean;
    shouldCalculateDistanceAmount: boolean;
    distanceRequestAmount: number;
    distanceCurrency: string | undefined;
    isPerDiemRequest: boolean;
    prevCurrency: string | undefined;
    currency: string | undefined;
    prevSubRates: SubRates;
};

/**
 * Computes the display amount and per-attendee amount for the confirmation flow.
 *
 * Handles the three amount sources — distance (recalculated from the route), per-diem
 * (summed from sub-rates), and plain IOU amount — and formats them for display,
 * including the pending-route and scanning special cases.
 */
function useConfirmationAmount({
    transaction,
    iouAmount,
    iouCurrencyCode,
    iouAttendees,
    isDistanceRequest,
    isDistanceRequestWithPendingRoute,
    shouldCalculateDistanceAmount,
    distanceRequestAmount,
    distanceCurrency,
    isPerDiemRequest,
    prevCurrency,
    currency,
    prevSubRates,
}: UseConfirmationAmountParams) {
    const {translate} = useLocalize();
    const {convertToDisplayString} = useCurrencyListActions();

    const isScanRequest = isScanRequestUtil(transaction);

    const subRates = transaction?.comment?.customUnit?.subRates ?? [];
    const shouldCalculatePerDiemAmount = isPerDiemRequest && (iouAmount === 0 || JSON.stringify(prevSubRates) !== JSON.stringify(subRates) || prevCurrency !== currency);

    let amountToBeUsed = iouAmount;
    if (shouldCalculateDistanceAmount) {
        amountToBeUsed = distanceRequestAmount;
    } else if (shouldCalculatePerDiemAmount) {
        amountToBeUsed = computePerDiemExpenseAmount({subRates});
    }

    const displayCurrency = isDistanceRequest ? distanceCurrency : iouCurrencyCode;

    let formattedAmount = convertToDisplayString(amountToBeUsed, displayCurrency);
    if (isDistanceRequestWithPendingRoute) {
        formattedAmount = '';
    } else if (isScanning(transaction)) {
        formattedAmount = translate('iou.receiptStatusTitle');
    }

    const attendeeCount = iouAttendees?.length && iouAttendees.length > 0 ? iouAttendees.length : 1;
    const formattedAmountPerAttendee = isDistanceRequestWithPendingRoute || isScanRequest ? '' : convertToDisplayString(amountToBeUsed / attendeeCount, displayCurrency);

    return {amountToBeUsed, formattedAmount, formattedAmountPerAttendee, isScanRequest};
}

export default useConfirmationAmount;
