import type {OnyxEntry} from 'react-native-onyx';
import type {PaymentActionParams} from '@components/SettlementButton/types';
import Log from '@libs/Log';
import Navigation from '@libs/Navigation/Navigation';
import {hasInvoicingDetails} from '@userActions/Policy/Policy';
import CONST from '@src/CONST';
import type {IOUType} from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import ROUTES from '@src/ROUTES';
import type * as OnyxTypes from '@src/types/onyx';
import type {Participant} from '@src/types/onyx/IOU';
import type {PaymentMethodType} from '@src/types/onyx/OriginalMessage';

type BuildConfirmActionParams = {
    iouType: IOUType;
    policy: OnyxEntry<OnyxTypes.Policy>;
    transactionID: string | undefined;
    reportID: string;
    routeError: boolean | string | null | undefined;
    formError: TranslationPaths | '';
    selectedParticipants: Participant[];
    isDelegateAccessRestricted: boolean;
    validate: (paymentType?: PaymentMethodType) => {errorKey: TranslationPaths; shouldSetDidConfirmSplit?: boolean} | {errorKey: null} | null;
    setFormError: (error: TranslationPaths | '') => void;
    setDidConfirmSplit: (value: boolean) => void;
    showDelegateNoAccessModal: () => void;
    onConfirm?: (selectedParticipants: Participant[]) => void;
    onSendMoney?: (paymentMethod: PaymentMethodType | undefined) => void;
};

/**
 * Owns the click-confirm action for the Money Request confirmation flow.
 *
 * Handles three branches: (1) invoice-without-company-info routes to the company info
 * step before validation; (2) non-PAY types invoke `onConfirm`; (3) PAY types run
 * delegate-access gating and invoke `onSendMoney` with the chosen payment method.
 * Validation results drive form-error state.
 */
function buildConfirmAction({
    iouType,
    policy,
    transactionID,
    reportID,
    routeError,
    formError,
    selectedParticipants,
    isDelegateAccessRestricted,
    validate,
    setFormError,
    setDidConfirmSplit,
    showDelegateNoAccessModal,
    onConfirm,
    onSendMoney,
}: BuildConfirmActionParams) {
    return ({paymentType: paymentMethod}: PaymentActionParams) => {
        // Routing short-circuit: invoices without company info go to the company info step before we validate anything.
        if (iouType === CONST.IOU.TYPE.INVOICE && !hasInvoicingDetails(policy) && transactionID && !routeError) {
            Navigation.navigate(ROUTES.MONEY_REQUEST_STEP_COMPANY_INFO.getRoute(iouType, transactionID, reportID, Navigation.getActiveRoute()));
            return;
        }

        const result = validate(paymentMethod);
        if (!result) {
            return;
        }

        if (result.errorKey) {
            if (result.shouldSetDidConfirmSplit) {
                setDidConfirmSplit(true);
            }
            setFormError(result.errorKey);
            return;
        }

        if (iouType !== CONST.IOU.TYPE.PAY) {
            if (formError) {
                return;
            }
            onConfirm?.(selectedParticipants);
            return;
        }

        // PAY branch side effects.
        if (!paymentMethod) {
            return;
        }
        if (isDelegateAccessRestricted) {
            showDelegateNoAccessModal();
            return;
        }
        if (formError) {
            return;
        }
        Log.info(`[IOU] Sending money via: ${paymentMethod}`);
        onSendMoney?.(paymentMethod);
    };
}

export default buildConfirmAction;
