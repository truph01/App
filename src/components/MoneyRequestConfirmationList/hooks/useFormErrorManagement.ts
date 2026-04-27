import {useIsFocused} from '@react-navigation/native';
import {useEffect, useRef} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import {isAttendeeTrackingEnabled} from '@libs/PolicyUtils';
import {areRequiredFieldsEmpty, getTag, hasMissingSmartscanFields, isMerchantMissing} from '@libs/TransactionUtils';
import {isInvalidMerchantValue, isValidInputLength} from '@libs/ValidationUtils';
import {getIsViolationFixed} from '@libs/Violations/ViolationsUtils';
import CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import type * as OnyxTypes from '@src/types/onyx';
import type {Attendee} from '@src/types/onyx/IOU';
import type {CurrentUserPersonalDetails} from '@src/types/onyx/PersonalDetails';

type UseFormErrorManagementParams = {
    transaction: OnyxEntry<OnyxTypes.Transaction>;
    transactionReport: OnyxEntry<OnyxTypes.Report>;
    iouMerchant: string | undefined;
    iouCategory: string;
    iouAttendees: Attendee[];
    policy: OnyxEntry<OnyxTypes.Policy>;
    policyTags: OnyxEntry<OnyxTypes.PolicyTagLists>;
    policyCategories: OnyxEntry<OnyxTypes.PolicyCategories>;
    currentUserPersonalDetails: CurrentUserPersonalDetails;
    isEditingSplitBill: boolean | undefined;
    isPolicyExpenseChat: boolean;
    isScanRequest: boolean;
    shouldShowMerchant: boolean;
    hasSmartScanFailed: boolean | undefined;
    didConfirmSplit: boolean;
    routeError: string | null | undefined;
    isTypeSplit: boolean;
    shouldShowReadOnlySplits: boolean;
};

type UseFormErrorManagementResult = {
    formError: TranslationPaths | '';
    debouncedFormError: TranslationPaths | '';
    setFormError: (value: TranslationPaths | '') => void;
    clearFormErrors: (errors: string[]) => void;
    shouldDisplayFieldError: boolean;
    isMerchantEmpty: boolean;
    isMerchantRequired: boolean;
    isMerchantFieldValid: boolean;
    isViolationFixed: boolean;
    errorMessage: string | undefined;
};

function useFormErrorManagement({
    transaction,
    transactionReport,
    iouMerchant,
    iouCategory,
    iouAttendees,
    policy,
    policyTags,
    policyCategories,
    currentUserPersonalDetails,
    isEditingSplitBill,
    isPolicyExpenseChat,
    isScanRequest,
    shouldShowMerchant,
    hasSmartScanFailed,
    didConfirmSplit,
    routeError,
    isTypeSplit,
    shouldShowReadOnlySplits,
}: UseFormErrorManagementParams): UseFormErrorManagementResult {
    const isFocused = useIsFocused();
    const {translate} = useLocalize();
    const [formError, debouncedFormError, setFormError] = useDebouncedState<TranslationPaths | ''>('');

    // Clear the form error if it's set to one among the list passed as an argument
    const clearFormErrors = (errors: string[]) => {
        if (!errors.includes(formError)) {
            return;
        }

        setFormError('');
    };

    const shouldDisplayFieldError: boolean =
        !!isEditingSplitBill &&
        ((!!hasSmartScanFailed && hasMissingSmartscanFields(transaction, transactionReport)) || (didConfirmSplit && areRequiredFieldsEmpty(transaction, transactionReport)));

    const isMerchantEmpty = !iouMerchant || isMerchantMissing(transaction);
    const isMerchantRequired = isPolicyExpenseChat && (!isScanRequest || !!isEditingSplitBill) && shouldShowMerchant;
    const isMerchantFieldValid = (() => {
        const merchantValue = iouMerchant ?? '';
        const trimmedMerchant = merchantValue.trim();
        const {isValid} = isValidInputLength(merchantValue, CONST.MERCHANT_NAME_MAX_BYTES);

        if (!isValid) {
            return false;
        }

        if (!trimmedMerchant) {
            return !isMerchantRequired;
        }

        return !isInvalidMerchantValue(trimmedMerchant);
    })();

    const isViolationFixed = getIsViolationFixed(formError, {
        category: iouCategory,
        tag: getTag(transaction),
        taxCode: transaction?.taxCode,
        taxValue: transaction?.taxValue,
        policyCategories,
        policyTagLists: policyTags,
        policyTaxRates: policy?.taxRates?.taxes,
        iouAttendees,
        currentUserPersonalDetails,
        isAttendeeTrackingEnabled: isAttendeeTrackingEnabled(policy),
        isControlPolicy: policy?.type === CONST.POLICY.TYPE.CORPORATE,
    });

    // Mirror formError into a ref so the effect below can read the current value without listing
    // formError as a dependency. We don't want this effect to re-run just because formError changed —
    // it should only react to focus / validation-state changes. (setFormError is stable across
    // renders because useDebouncedState memoizes its setter.)
    const formErrorRef = useRef(formError);
    useEffect(() => {
        formErrorRef.current = formError;
    }, [formError]);

    useEffect(() => {
        const currentFormError = formErrorRef.current;
        if (shouldDisplayFieldError && didConfirmSplit) {
            setFormError('iou.error.genericSmartscanFailureMessage');
            return;
        }
        if (shouldDisplayFieldError && hasSmartScanFailed) {
            setFormError('iou.receiptScanningFailed');
            return;
        }
        if (currentFormError === 'iou.error.invalidMerchant' && isMerchantFieldValid) {
            setFormError('');
            return;
        }
        // Check 1: If formError does NOT start with "violations.", clear it and return
        // Reset the form error whenever the screen gains or loses focus
        // but preserve violation-related errors since those represent real validation issues
        // that can only be resolved by fixing the underlying issue
        if (currentFormError && !currentFormError.startsWith(CONST.VIOLATIONS_PREFIX)) {
            setFormError('');
            return;
        }
        // Check 2: Only reached if formError STARTS with "violations."
        // Clear any violation error if the user has fixed the underlying issue
        if (isViolationFixed) {
            setFormError('');
        }
    }, [isFocused, shouldDisplayFieldError, hasSmartScanFailed, didConfirmSplit, isViolationFixed, isMerchantFieldValid, setFormError]);

    const computeErrorMessage = (): string | undefined => {
        if (routeError) {
            return routeError;
        }
        if (isTypeSplit && !shouldShowReadOnlySplits) {
            return debouncedFormError ? translate(debouncedFormError) : undefined;
        }
        // Don't show error at the bottom of the form for missing attendees — the field surfaces it inline.
        if (formError === 'violations.missingAttendees') {
            return undefined;
        }
        return formError ? translate(formError) : undefined;
    };
    const errorMessage = computeErrorMessage();

    return {
        formError,
        debouncedFormError,
        setFormError,
        clearFormErrors,
        shouldDisplayFieldError,
        isMerchantEmpty,
        isMerchantRequired,
        isMerchantFieldValid,
        isViolationFixed,
        errorMessage,
    };
}

export default useFormErrorManagement;
