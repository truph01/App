import React from 'react';
import {DefaultClientFailureScreen} from '@components/MultifactorAuthentication/components/OutcomeScreen';
import {useMultifactorAuthenticationState} from '@components/MultifactorAuthentication/Context';
import type {ErrorState} from '@components/MultifactorAuthentication/Context/State';
import CONST from '@src/CONST';

// HTTP status codes starting with 5 indicate server errors (5xx)
function isServerError(error: ErrorState): boolean {
    const HTTP_SERVER_ERROR_PREFIX = '5';
    return (
        error.reason === CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.UNKNOWN_RESPONSE || (error.httpStatus !== undefined && String(error.httpStatus).startsWith(HTTP_SERVER_ERROR_PREFIX))
    );
}

function MultifactorAuthenticationOutcomePage() {
    const {state} = useMultifactorAuthenticationState();
    const {scenario} = state;

    if (!scenario) {
        return <DefaultClientFailureScreen />;
    }

    if (!state.error) {
        return scenario.successScreen;
    }

    const reasonScreen = scenario.failureScreens?.[state.error.reason];
    if (reasonScreen) {
        return reasonScreen;
    }

    if (isServerError(state.error)) {
        return scenario.defaultServerFailureScreen;
    }

    return scenario.defaultClientFailureScreen;
}

MultifactorAuthenticationOutcomePage.displayName = 'MultifactorAuthenticationOutcomePage';

export default MultifactorAuthenticationOutcomePage;
