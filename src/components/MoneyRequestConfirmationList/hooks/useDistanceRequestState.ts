import type {OnyxEntry} from 'react-native-onyx';
import useOnyx from '@hooks/useOnyx';
import usePrevious from '@hooks/usePrevious';
import DistanceRequestUtils from '@libs/DistanceRequestUtils';
import {getDistanceInMeters, hasRoute as hasRouteUtil} from '@libs/TransactionUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type * as OnyxTypes from '@src/types/onyx';

const mileageRateSelector = (policy: OnyxEntry<OnyxTypes.Policy>) => DistanceRequestUtils.getDefaultMileageRate(policy);
const policyDraftSelector = (draft: OnyxEntry<OnyxTypes.Policy>) => draft && ({customUnits: draft.customUnits} as OnyxEntry<OnyxTypes.Policy>);

type UseDistanceRequestStateParams = {
    transaction: OnyxEntry<OnyxTypes.Transaction>;
    policy: OnyxEntry<OnyxTypes.Policy>;
    policyID: string | undefined;
    policyForMovingExpenses: OnyxEntry<OnyxTypes.Policy>;
    isMovingTransactionFromTrackExpense: boolean;
    isDistanceRequest: boolean;
    iouAmount: number;
    iouCurrencyCode: string;
};

function useDistanceRequestState({
    transaction,
    policy,
    policyID,
    policyForMovingExpenses,
    isMovingTransactionFromTrackExpense,
    isDistanceRequest,
    iouAmount,
    iouCurrencyCode,
}: UseDistanceRequestStateParams) {
    const [policyDraft] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_DRAFTS}${policyID}`, {
        selector: policyDraftSelector,
    });
    const [defaultMileageRateDraft] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_DRAFTS}${policyID}`, {
        selector: mileageRateSelector,
    });
    const [defaultMileageRateReal] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${policyID}`, {
        selector: mileageRateSelector,
    });

    const defaultMileageRate = defaultMileageRateDraft ?? defaultMileageRateReal;
    const defaultRate = defaultMileageRate?.customUnitRateID;

    const mileageRate = DistanceRequestUtils.getRate({
        transaction,
        policy,
        ...(isMovingTransactionFromTrackExpense && {policyForMovingExpenses}),
        isMovingTransactionFromTrackExpense,
        policyDraft,
    });
    const distanceRate = mileageRate.rate;
    const distanceUnit = mileageRate.unit;
    const calculateFromTransactionData = isMovingTransactionFromTrackExpense && !distanceRate;
    const unit = calculateFromTransactionData ? transaction?.comment?.customUnit?.distanceUnit : distanceUnit;
    const rate = calculateFromTransactionData ? Math.abs(iouAmount) / (transaction?.comment?.customUnit?.quantity ?? 1) : distanceRate;
    const currency = calculateFromTransactionData ? iouCurrencyCode : (mileageRate.currency ?? CONST.CURRENCY.USD);
    const prevRate = usePrevious(rate);
    const prevUnit = usePrevious(unit);
    const prevCurrency = usePrevious(currency);

    const distance = getDistanceInMeters(transaction, unit);
    const prevDistance = usePrevious(distance);
    const shouldCalculateDistanceAmount = isDistanceRequest && (iouAmount === 0 || prevRate !== rate || prevDistance !== distance || prevCurrency !== currency || prevUnit !== unit);

    const hasRoute = hasRouteUtil(transaction, isDistanceRequest);
    const isDistanceRequestWithPendingRoute = isDistanceRequest && (!hasRoute || !rate) && !isMovingTransactionFromTrackExpense;

    const distanceRequestAmount = DistanceRequestUtils.getDistanceRequestAmount(distance, unit ?? CONST.CUSTOM_UNITS.DISTANCE_UNIT_MILES, rate ?? 0);

    return {
        policyDraft,
        defaultMileageRate,
        defaultRate,
        mileageRate,
        distanceRate,
        distanceUnit,
        calculateFromTransactionData,
        unit,
        rate,
        currency,
        prevRate,
        prevUnit,
        prevCurrency,
        distance,
        prevDistance,
        shouldCalculateDistanceAmount,
        hasRoute,
        isDistanceRequestWithPendingRoute,
        distanceRequestAmount,
    };
}

export default useDistanceRequestState;
