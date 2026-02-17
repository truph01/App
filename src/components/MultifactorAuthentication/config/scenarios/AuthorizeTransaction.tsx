import React from 'react';
import {FailureScreenBase, OutOfTimeFailureScreen, SuccessScreenBase} from '@components/MultifactorAuthentication/components/OutcomeScreen';
import type {MultifactorAuthenticationScenarioCustomConfig} from '@components/MultifactorAuthentication/config/types';
import variables from '@styles/variables';
import {authorizeTransaction} from '@userActions/MultifactorAuthentication';
import CONST from '@src/CONST';
import SCREENS from '@src/SCREENS';

type Payload = {
    transactionID: string;
};

export default {
    allowedAuthenticationMethods: [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS],
    action: authorizeTransaction,
    screen: SCREENS.MULTIFACTOR_AUTHENTICATION.AUTHORIZE_TRANSACTION,
    failureHeaderTitle: 'multifactorAuthentication.reviewTransaction.reviewTransaction',
    successScreen: (
        <SuccessScreenBase
            headerTitle="multifactorAuthentication.reviewTransaction.reviewTransaction"
            illustration="ApprovedTransactionHand"
            iconWidth={variables.transactionHandWidth}
            iconHeight={variables.transactionHandHeight}
            title="multifactorAuthentication.reviewTransaction.transactionApproved"
            subtitle="multifactorAuthentication.reviewTransaction.goBackToTheMerchant"
        />
    ),
    defaultClientFailureScreen: (
        <FailureScreenBase
            headerTitle="multifactorAuthentication.reviewTransaction.reviewTransaction"
            illustration="DeniedTransactionHand"
            iconWidth={variables.transactionHandWidth}
            iconHeight={variables.transactionHandHeight}
            title="multifactorAuthentication.reviewTransaction.transactionDenied"
            subtitle="multifactorAuthentication.reviewTransaction.youCanTryAgainAtMerchantOrReachOut"
        />
    ),
    defaultServerFailureScreen: (
        <FailureScreenBase
            headerTitle="multifactorAuthentication.reviewTransaction.reviewTransaction"
            illustration="DeniedTransactionHand"
            iconWidth={variables.transactionHandWidth}
            iconHeight={variables.transactionHandHeight}
            title="multifactorAuthentication.reviewTransaction.transactionDenied"
            subtitle="multifactorAuthentication.reviewTransaction.youCanTryAgainAtMerchantOrReachOut"
        />
    ),
    failureScreens: {
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.TRANSACTION_EXPIRED]: <OutOfTimeFailureScreen headerTitle="multifactorAuthentication.reviewTransaction.reviewTransaction" />,
    },
    MODALS: {
        cancelConfirmation: {
            description: 'multifactorAuthentication.reviewTransaction.areYouSureToDeny',
            confirmButtonText: 'multifactorAuthentication.reviewTransaction.denyTransaction',
        },
    },
} as const satisfies MultifactorAuthenticationScenarioCustomConfig<Payload>;

export type {Payload};
