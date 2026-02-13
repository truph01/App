import React from 'react';
import variables from '@styles/variables';
import createScreenWithDefaults from '@components/MultifactorAuthentication/components/OutcomeScreen/createScreenWithDefaults';
import SuccessScreenBase from './SuccessScreenBase';
import type {SuccessScreenBaseProps} from './SuccessScreenBase';

const DefaultSuccessScreen = createScreenWithDefaults<SuccessScreenBaseProps>(
    <SuccessScreenBase
        headerTitle="multifactorAuthentication.biometricsTest.biometricsAuthentication"
        illustration="OpenPadlock"
        iconWidth={variables.openPadlockWidth}
        iconHeight={variables.openPadlockHeight}
        title="multifactorAuthentication.biometricsTest.authenticationSuccessful"
        subtitle="multifactorAuthentication.biometricsTest.successfullyAuthenticatedUsing"
    />,
    'DefaultSuccessScreen',
);

export default DefaultSuccessScreen;
