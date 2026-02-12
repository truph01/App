import React from 'react';
import createScreenWithDefaults from '@components/MultifactorAuthentication/components/createScreenWithDefaults';
import NoEligibleMethodsDescription from '@components/MultifactorAuthentication/NoEligibleMethodsDescription';
import UnsupportedDeviceDescription from '@components/MultifactorAuthentication/UnsupportedDeviceDescription';
import variables from '@styles/variables';
import FailureScreenBase from './FailureScreenBase';
import type {FailureScreenBaseProps} from './FailureScreenBase';

const DefaultFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="HumptyDumpty"
        iconWidth={variables.humptyDumptyWidth}
        iconHeight={variables.humptyDumptyHeight}
        title="multifactorAuthentication.oops"
        subtitle="multifactorAuthentication.biometricsTest.yourAttemptWasUnsuccessful"
    />,
    'DefaultFailureScreen',
);

const OutOfTimeFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="RunOutOfTime"
        iconWidth={variables.runOutOfTimeWidth}
        iconHeight={variables.runOutOfTimeHeight}
        title="multifactorAuthentication.youRanOutOfTime"
        subtitle="multifactorAuthentication.looksLikeYouRanOutOfTime"
    />,
    'OutOfTimeFailureScreen',
);

const NoEligibleMethodsFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="HumptyDumpty"
        iconWidth={variables.humptyDumptyWidth}
        iconHeight={variables.humptyDumptyHeight}
        title="multifactorAuthentication.biometricsTest.youCouldNotBeAuthenticated"
        subtitle="multifactorAuthentication.biometricsTest.youCouldNotBeAuthenticated"
        customSubtitle={<NoEligibleMethodsDescription />}
    />,
    'NoEligibleMethodsFailureScreen',
);

const UnsupportedDeviceFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="HumptyDumpty"
        iconWidth={variables.humptyDumptyWidth}
        iconHeight={variables.humptyDumptyHeight}
        title="multifactorAuthentication.unsupportedDevice.unsupportedDevice"
        subtitle="multifactorAuthentication.biometricsTest.youCouldNotBeAuthenticated"
        customSubtitle={<UnsupportedDeviceDescription />}
    />,
    'UnsupportedDeviceFailureScreen',
);

export {DefaultFailureScreen, OutOfTimeFailureScreen, NoEligibleMethodsFailureScreen, UnsupportedDeviceFailureScreen};
