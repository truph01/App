import useOnyx from '@hooks/useOnyx';
import {fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt} from '@libs/actions/MultifactorAuthentication';
import ONYXKEYS from '@src/ONYXKEYS';
import CONST from '@src/CONST';
import type {TransactionPending3DSReview} from '@src/types/onyx';
import {useEffect, useMemo} from 'react';
import ROUTES from '@src/ROUTES';
import useNativeBiometrics from '@components/MultifactorAuthentication/Context/useNativeBiometrics';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import Navigation from './Navigation';

function getOldestTransactionPendingReview(transactions: TransactionPending3DSReview[]) {
    return transactions
        .sort((a, b) => {
            // We really really want predictable, stable ordering for transaction challenges.
            // Prioritize created date, but if they're the same sort by expired date,
            // and if those are the same, sort by ID
            const createdDiff = new Date(a.created).getTime() - new Date(b.created).getTime();
            if (createdDiff !== 0) {
                return createdDiff;
            }

            const expiresDiff = new Date(a.expires).getTime() - new Date(b.expires).getTime();
            if (expiresDiff !== 0) {
                return expiresDiff;
            }

            return Number(a.transactionID) - Number(b.transactionID);
        })
        .at(0);
}

function useNavigateTo3DSAuthorizationChallenge() {
    const [blocklistedTransactionChallenges, blocklistResult] = useOnyx(ONYXKEYS.BLOCKLISTED_3DS_TRANSACTION_CHALLENGES, {canBeMissing: true});
    const [transactionsPending3DSReview] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true});

    const {doesDeviceSupportBiometrics} = useNativeBiometrics();

    const transactionPending3DSReview = useMemo(() => {
        if (!transactionsPending3DSReview || isLoadingOnyxValue(blocklistResult)) {
            return undefined;
        }
        const nonBlocklistedTransactions = Object.values(transactionsPending3DSReview).filter((challenge) =>
            blocklistedTransactionChallenges && challenge.transactionID ? !blocklistedTransactionChallenges[challenge.transactionID] : true,
        );
        return getOldestTransactionPendingReview(nonBlocklistedTransactions);
    }, [transactionsPending3DSReview, blocklistedTransactionChallenges, blocklistResult]);

    useEffect(() => {
        if (!transactionPending3DSReview?.transactionID) {
            return;
        }

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
            return;
        }

        let cancel = false;

        async function maybeNavigateTo3DSChallenge() {
            if (!transactionPending3DSReview?.transactionID) {
                return;
            }

            const challengeStillValid = await fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt({transactionID: transactionPending3DSReview.transactionID});
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
