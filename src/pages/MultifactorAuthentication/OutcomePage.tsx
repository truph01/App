import React from 'react';
import {DefaultFailureScreen} from '@components/MultifactorAuthentication/components/FailureScreen';
import {useMultifactorAuthenticationState} from '@components/MultifactorAuthentication/Context';

function MultifactorAuthenticationOutcomePage() {
    const {state} = useMultifactorAuthenticationState();
    const {scenario} = state;

    if (!scenario) {
        return <DefaultFailureScreen />;
    }

    if (!state.error) {
        return scenario.successScreen;
    }

    return scenario.failureScreens?.[state.error.reason] ?? scenario.defaultFailureScreen;
}

MultifactorAuthenticationOutcomePage.displayName = 'MultifactorAuthenticationOutcomePage';

export default MultifactorAuthenticationOutcomePage;
