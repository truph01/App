import useOnyx from '@hooks/useOnyx';
import {refreshTransactionsPending3DSReview} from '@libs/actions/MultifactorAuthentication';
import ONYXKEYS from '@src/ONYXKEYS';
import CONST from '@src/CONST';
import type {TransactionsPending3DSReview} from '@src/types/onyx';
import {useEffect} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import ROUTES from '@src/ROUTES';
import useNativeBiometrics from '@components/MultifactorAuthentication/Context/useNativeBiometrics';
import AuthorizeTransaction from '@components/MultifactorAuthentication/config/scenarios/AuthorizeTransaction';
import Navigation from './Navigation';

function getMostUrgentTransactionPendingReview(transactions: OnyxEntry<TransactionsPending3DSReview>) {
    return transactions
        ? Object.values(transactions)
              .sort((a, b) => {
                  const aExpires = new Date(a.expires);
                  const bExpires = new Date(b.expires);
                  if (aExpires < bExpires) {
                      return -1;
                  }
                  if (aExpires > bExpires) {
                      return 1;
                  }
                  return 0;
              })
              .at(0)
        : undefined;
}

function useNavigateTo3DSAuthorizationChallenge() {
    const [transactionPending3DSReview] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true, selector: getMostUrgentTransactionPendingReview});

    const {doesDeviceSupportBiometrics} = useNativeBiometrics();

    // TODO MFA:
    // 1. [x] Listen for the TRANSACTIONS_PENDING_3DS_REVIEW Onyx Key changes
    // 2. [x] Sort by `expires` field, the oldest one is the first one
    // 3. [x] If the Authorize Transaction scenario supports native if on mobile and passkeys on web
    // 4. [-] Make an API call (GetTransactionsPending3DSReview) to verify the transaction - it will return the same object as the one stored in Onyx (mocked)
    // 5. [x] If the transaction is okay - if not on any MFA screen then navigate to the TransactionReviewPage.
    useEffect(() => {
        if (!transactionPending3DSReview?.transactionID) {
            return;
        }

        const {allowedAuthenticationMethods} = AuthorizeTransaction;
        const doesDeviceSupportAnAllowedAuthenticationMethod = allowedAuthenticationMethods.some((method) => {
            switch (method) {
                case CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS:
                    return doesDeviceSupportBiometrics();
                // TODO expand when we support passkeys
                default:
                    return false;
            }
        });

        if (!doesDeviceSupportAnAllowedAuthenticationMethod) {
            return;
        }

        let cancel = false;

        async function maybeNavigateTo3DSChallenge() {
            const challengeStillValid = await refreshTransactionsPending3DSReview();
            if (!challengeStillValid || cancel || !transactionPending3DSReview?.transactionID) {
                return;
            }
            Navigation.navigate(ROUTES.MULTIFACTOR_AUTHENTICATION_AUTHORIZE_TRANSACTION.getRoute(transactionPending3DSReview.transactionID));
        }

        maybeNavigateTo3DSChallenge();
        return () => {
            cancel = true;
        };
    }, [transactionPending3DSReview?.transactionID, doesDeviceSupportBiometrics]);
}

export default useNavigateTo3DSAuthorizationChallenge;
