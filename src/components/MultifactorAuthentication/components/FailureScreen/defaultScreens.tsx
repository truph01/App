import React from 'react';
import createScreenWithDefaults from '@components/MultifactorAuthentication/components/createScreenWithDefaults';
import NoEligibleMethodsDescription from '@components/MultifactorAuthentication/NoEligibleMethodsDescription';
import UnsupportedDeviceDescription from '@components/MultifactorAuthentication/UnsupportedDeviceDescription';
import variables from '@styles/variables';
import FailureScreenBase from './FailureScreenBase';
import type {FailureScreenBaseProps} from './FailureScreenBase';

const DefaultClientFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="MagnifyingGlassSpyMouthClosed"
        iconWidth={variables.magnifyingGlassSpyMouthClosedWidth}
        iconHeight={variables.magnifyingGlassSpyMouthClosedHeight}
        title="multifactorAuthentication.oops"
        subtitle="multifactorAuthentication.biometricsTest.yourAttemptWasUnsuccessful"
    />,
    'DefaultClientFailureScreen',
);

const DefaultServerFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <FailureScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="HumptyDumpty"
        iconWidth={variables.humptyDumptyWidth}
        iconHeight={variables.humptyDumptyHeight}
        title="multifactorAuthentication.oops"
        subtitle="multifactorAuthentication.biometricsTest.yourAttemptWasUnsuccessful"
    />,
    'DefaultServerFailureScreen',
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
    <DefaultClientFailureScreen
        title="multifactorAuthentication.biometricsTest.youCouldNotBeAuthenticated"
        customSubtitle={<NoEligibleMethodsDescription />}
    />,
    'NoEligibleMethodsFailureScreen',
);

const UnsupportedDeviceFailureScreen = createScreenWithDefaults<FailureScreenBaseProps>(
    <DefaultClientFailureScreen
        title="multifactorAuthentication.unsupportedDevice.unsupportedDevice"
        customSubtitle={<UnsupportedDeviceDescription />}
    />,
    'UnsupportedDeviceFailureScreen',
);

export {DefaultClientFailureScreen, DefaultServerFailureScreen, OutOfTimeFailureScreen, NoEligibleMethodsFailureScreen, UnsupportedDeviceFailureScreen};
