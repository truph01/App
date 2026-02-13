import React from 'react';
import {useMultifactorAuthenticationState} from '@components/MultifactorAuthentication/Context';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';

function AuthenticationMethodDescription() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {state} = useMultifactorAuthenticationState();

    return (
        <Text style={[styles.textAlignCenter, styles.textSupporting]}>
            {translate('multifactorAuthentication.biometricsTest.successfullyAuthenticatedUsing', {authType: state.authenticationMethod?.name})}
        </Text>
    );
}

AuthenticationMethodDescription.displayName = 'AuthenticationMethodDescription';

export default AuthenticationMethodDescription;
