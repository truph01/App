import useOnyx from '@hooks/useOnyx';
import {fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt} from '@libs/actions/MultifactorAuthentication';
import ONYXKEYS from '@src/ONYXKEYS';
import CONST from '@src/CONST';
import type {TransactionPending3DSReview} from '@src/types/onyx';
import {useEffect, useMemo} from 'react';
import ROUTES from '@src/ROUTES';
import useNativeBiometrics from '@components/MultifactorAuthentication/Context/useNativeBiometrics';
// move TODO about this to scenario config
// import AuthorizeTransaction from '@components/MultifactorAuthentication/config/scenarios/AuthorizeTransaction';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import Navigation from './Navigation';

function getMostUrgentTransactionPendingReview(transactions: TransactionPending3DSReview[]) {
    return transactions
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
        .at(0);
}

function useNavigateTo3DSAuthorizationChallenge() {
    const [blocklistedTransactionChallenges, blocklistResult] = useOnyx(ONYXKEYS.BLOCKLISTED_3DS_TRANSACTION_CHALLENGES, {canBeMissing: true});
    const [transactionsPending3DSReview] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true});

    console.log("[useNavigateTo3DSAuthorizationChallenge] transactionsPending3DSReview", transactionsPending3DSReview);
    console.log("[useNavigateTo3DSAuthorizationChallenge] blocklistedTransactionChallenges", blocklistedTransactionChallenges);


    const {doesDeviceSupportBiometrics} = useNativeBiometrics();

    const transactionPending3DSReview = useMemo(() => {
        if (!transactionsPending3DSReview || isLoadingOnyxValue(blocklistResult)) {
            return undefined;
        }
        const nonBlocklistedTransactions = Object.values(transactionsPending3DSReview).filter((challenge) =>
            blocklistedTransactionChallenges && challenge.transactionID ? !blocklistedTransactionChallenges[challenge.transactionID] : true,
        );
        return getMostUrgentTransactionPendingReview(nonBlocklistedTransactions);
    }, [transactionsPending3DSReview, blocklistedTransactionChallenges, blocklistResult]);

    // TODO MFA:
    // 1. [x] Listen for the TRANSACTIONS_PENDING_3DS_REVIEW Onyx Key changes
    // 2. [x] Sort by `expires` field, the oldest one is the first one
    // 3. [x] If the Authorize Transaction scenario supports native if on mobile and passkeys on web
    // 4. [-] Make an API call (GetTransactionsPending3DSReview) to verify the transaction - it will return the same object as the one stored in Onyx (mocked)
    // 5. [x] If the transaction is okay - if not on any MFA screen then navigate to the TransactionReviewPage.
    // 6. [x] blocklist transactions when we attempt to respond to them and ignore them in the queue
    // 7. [x] remove transactions from the blocklist when we observe them removed from the queue
    useEffect(() => {
        if (!transactionPending3DSReview?.transactionID) {
            return;
        }

        console.log('[useNavigateTo3DSAuthorizationChallenge] maybe navigating to queued challenge', transactionPending3DSReview?.transactionID);

        // note: importing AuthorizeTransaction in this file causes the browser to get stuck in an infinite reload loop
        // TODO figure out why (hard-coded to BIOMETRICS for now)
        // const allowedAuthenticationMethods = AuthorizeTransaction.allowedAuthenticationMethods;
        const allowedAuthenticationMethods = [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS];
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
            // return;
        }

        let cancel = false;

        async function maybeNavigateTo3DSChallenge() {
            if (!transactionPending3DSReview?.transactionID) {
                return;
            }
            const challengeStillValid = await fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt({transactionID: transactionPending3DSReview.transactionID});
            console.log("challengeStillValid", challengeStillValid);
            if (!challengeStillValid || cancel) {
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
