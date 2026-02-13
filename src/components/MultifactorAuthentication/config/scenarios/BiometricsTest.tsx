import React from 'react';
import {UnsupportedDeviceFailureScreen} from '@components/MultifactorAuthentication/components/OutcomeScreen';
import type {MultifactorAuthenticationScenarioCustomConfig} from '@components/MultifactorAuthentication/config/types';
import {troubleshootMultifactorAuthentication} from '@userActions/MultifactorAuthentication';
import CONST from '@src/CONST';
import SCREENS from '@src/SCREENS';

export default {
    allowedAuthenticationMethods: [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS],
    action: troubleshootMultifactorAuthentication,
    screen: SCREENS.MULTIFACTOR_AUTHENTICATION.BIOMETRICS_TEST,
    pure: true,
    failureScreens: {
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.UNSUPPORTED_DEVICE]: (
            <UnsupportedDeviceFailureScreen
                subtitle="multifactorAuthentication.biometricsTest.areYouSureToReject"
                customSubtitle={undefined}
            />
        ),
    },
} as const satisfies MultifactorAuthenticationScenarioCustomConfig;
