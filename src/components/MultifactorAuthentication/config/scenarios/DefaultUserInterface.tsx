import React from 'react';
import {DefaultFailureScreen, NoEligibleMethodsFailureScreen, OutOfTimeFailureScreen, UnsupportedDeviceFailureScreen} from '@components/MultifactorAuthentication/components/FailureScreen';
import {DefaultSuccessScreen} from '@components/MultifactorAuthentication/components/SuccessScreen';
import type {MultifactorAuthenticationDefaultUIConfig, MultifactorAuthenticationScenarioCustomConfig} from '@components/MultifactorAuthentication/config/types';
import CONST from '@src/CONST';

const DEFAULT_CONFIG = {
    MODALS: {
        cancelConfirmation: {
            title: 'common.areYouSure',
            description: 'multifactorAuthentication.biometricsTest.areYouSureToReject',
            confirmButtonText: 'multifactorAuthentication.biometricsTest.rejectAuthentication',
            cancelButtonText: 'common.cancel',
        },
    },
    successScreen: <DefaultSuccessScreen />,
    defaultFailureScreen: <DefaultFailureScreen />,
    failureScreens: {
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.NO_ELIGIBLE_METHODS]: <NoEligibleMethodsFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.UNSUPPORTED_DEVICE]: <UnsupportedDeviceFailureScreen />,
        [CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.TOO_MANY_ATTEMPTS]: <OutOfTimeFailureScreen />,
    },
} as const satisfies MultifactorAuthenticationDefaultUIConfig;

function customConfig<const T extends MultifactorAuthenticationScenarioCustomConfig<never>>(config: T) {
    const MODALS = {
        ...DEFAULT_CONFIG.MODALS,
        ...config.MODALS,
        cancelConfirmation: {
            ...DEFAULT_CONFIG.MODALS.cancelConfirmation,
            ...config.MODALS?.cancelConfirmation,
        },
    } as const;

    return {
        ...DEFAULT_CONFIG,
        ...config,
        MODALS,
        successScreen: config.successScreen ?? DEFAULT_CONFIG.successScreen,
        defaultFailureScreen: config.defaultFailureScreen ?? DEFAULT_CONFIG.defaultFailureScreen,
        failureScreens: {...DEFAULT_CONFIG.failureScreens, ...config.failureScreens},
    } as const;
}

export default DEFAULT_CONFIG;
export {customConfig};
