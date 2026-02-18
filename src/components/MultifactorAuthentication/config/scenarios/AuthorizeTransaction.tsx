import React from 'react';
import createScreenWithDefaults from '@components/MultifactorAuthentication/components/OutcomeScreen/createScreenWithDefaults';
import {
    DefaultClientFailureScreen,
    DefaultServerFailureScreen,
    NoEligibleMethodsFailureScreen,
    OutOfTimeFailureScreen,
    UnsupportedDeviceFailureScreen,
} from '@components/MultifactorAuthentication/components/OutcomeScreen/FailureScreen/defaultScreens';
import DefaultSuccessScreen from '@components/MultifactorAuthentication/components/OutcomeScreen/SuccessScreen/defaultScreens';
import type {MultifactorAuthenticationScenarioCustomConfig} from '@components/MultifactorAuthentication/config/types';
import variables from '@styles/variables';
import {authorizeTransaction} from '@userActions/MultifactorAuthentication';
import CONST from '@src/CONST';
import SCREENS from '@src/SCREENS';

type Payload = {
    transactionID: string;
};

const DefaultTransactionReviewClientFailureScreen = createScreenWithDefaults(
    DefaultClientFailureScreen,
    {
        headerTitle: 'multifactorAuthentication.reviewTransaction.transactionFailed',
        illustration: 'DeniedTransactionHand',
        iconWidth: variables.transactionHandWidth,
        iconHeight: variables.transactionHandHeight,
        title: 'multifactorAuthentication.reviewTransaction.transactionFailed',
        subtitle: 'multifactorAuthentication.reviewTransaction.transactionCouldNotBeCompleted',
    },
    'DefaultTransactionReviewClientFailureScreen',
);

const DeniedTransactionClientFailureScreen = createScreenWithDefaults(
    DefaultTransactionReviewClientFailureScreen,
    {
        subtitle: 'multifactorAuthentication.reviewTransaction.transactionCouldNotBeCompletedReachOut',
    },
    'DeniedTransactionFailureScreen',
);

const DeniedTransactionServerFailureScreen = createScreenWithDefaults(
    DefaultServerFailureScreen,
    {
        headerTitle: 'multifactorAuthentication.reviewTransaction.transactionFailed',
        subtitle: 'multifactorAuthentication.reviewTransaction.transactionCouldNotBeCompletedReachOut',
    },
    'DeniedTransactionServerFailureScreen',
);

const ApprovedTransactionSuccessScreen = createScreenWithDefaults(
    DefaultSuccessScreen,
    {
        headerTitle: 'multifactorAuthentication.reviewTransaction.transactionApproved',
        illustration: 'ApprovedTransactionHand',
        iconWidth: variables.transactionHandWidth,
        iconHeight: variables.transactionHandHeight,
        title: 'multifactorAuthentication.reviewTransaction.transactionApproved',
        subtitle: 'multifactorAuthentication.reviewTransaction.goBackToTheMerchant',
    },
    'ApprovedTransactionSuccessScreen',
);

const DeniedTransactionSuccessScreen = createScreenWithDefaults(
    DefaultSuccessScreen,
    {
        headerTitle: 'multifactorAuthentication.reviewTransaction.transactionDenied',
        illustration: 'DeniedTransactionHand',
        iconWidth: variables.transactionHandWidth,
        iconHeight: variables.transactionHandHeight,
        title: 'multifactorAuthentication.reviewTransaction.transactionDenied',
        subtitle: 'multifactorAuthentication.reviewTransaction.youCanTryAgainAtMerchantOrReachOut',
    },
    'DeniedTransactionSuccessScreen',
);

const AlreadyReviewedFailureScreen = createScreenWithDefaults(
    DefaultServerFailureScreen,
    {
        headerTitle: 'multifactorAuthentication.reviewTransaction.reviewFailed',
        subtitle: 'multifactorAuthentication.reviewTransaction.alreadyReviewedSubtitle',
    },
    'AlreadyReviewedFailureScreen',
);

export {
    DeniedTransactionServerFailureScreen,
    DeniedTransactionClientFailureScreen,
    DefaultTransactionReviewClientFailureScreen,
    ApprovedTransactionSuccessScreen,
    DeniedTransactionSuccessScreen,
    AlreadyReviewedFailureScreen,
};

export default {
    allowedAuthenticationMethods: [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS],
    action: authorizeTransaction,
    screen: SCREENS.MULTIFACTOR_AUTHENTICATION.AUTHORIZE_TRANSACTION,
    failureHeaderTitle: 'multifactorAuthentication.reviewTransaction.reviewTransaction',
    successScreen: (
        <DefaultSuccessScreen
            headerTitle="multifactorAuthentication.reviewTransaction.reviewTransaction"
            illustration="ApprovedTransactionHand"
            iconWidth={variables.transactionHandWidth}
            iconHeight={variables.transactionHandHeight}
            title="multifactorAuthentication.reviewTransaction.transactionApproved"
            subtitle="multifactorAuthentication.reviewTransaction.goBackToTheMerchant"
        />
    ),
    defaultClientFailureScreen: <DefaultTransactionReviewClientFailureScreen />,
    defaultServerFailureScreen: (
        <DefaultServerFailureScreen
            headerTitle="multifactorAuthentication.reviewTransaction.transactionFailed"
            subtitle="multifactorAuthentication.reviewTransaction.transactionCouldNotBeCompleted"
        />
    ),
    failureScreens: {
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.TRANSACTION_EXPIRED]: <OutOfTimeFailureScreen headerTitle="multifactorAuthentication.reviewTransaction.transactionFailed" />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.ALREADY_APPROVED_APPROVE_ATTEMPTED]: <ApprovedTransactionSuccessScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.ALREADY_DENIED_DENY_ATTEMPTED]: <DeniedTransactionSuccessScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.ALREADY_APPROVED_DENY_ATTEMPTED]: <AlreadyReviewedFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.ALREADY_DENIED_APPROVE_ATTEMPTED]: <AlreadyReviewedFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.ALREADY_REVIEWED]: <AlreadyReviewedFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.REQUESTED_TRANSACTION_UNAVAILABLE]: <AlreadyReviewedFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.EXPO.CANCELED]: <DeniedTransactionClientFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.NO_ELIGIBLE_METHODS]: <NoEligibleMethodsFailureScreen headerTitle="multifactorAuthentication.reviewTransaction.transactionFailed" />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.UNSUPPORTED_DEVICE]: <UnsupportedDeviceFailureScreen headerTitle="multifactorAuthentication.reviewTransaction.transactionFailed" />,
    },
    MODALS: {
        cancelConfirmation: {
            description: 'multifactorAuthentication.reviewTransaction.areYouSureToDeny',
            confirmButtonText: 'multifactorAuthentication.reviewTransaction.denyTransaction',
        },
    },
} as const satisfies MultifactorAuthenticationScenarioCustomConfig<Payload>;

export type {Payload};
