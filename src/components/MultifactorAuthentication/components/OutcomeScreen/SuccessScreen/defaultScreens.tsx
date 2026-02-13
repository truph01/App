import React from 'react';
import createScreenWithDefaults from '../createScreenWithDefaults';
import variables from '@styles/variables';
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
