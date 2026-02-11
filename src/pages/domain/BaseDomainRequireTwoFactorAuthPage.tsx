import React, {useRef} from 'react';
import {View} from 'react-native';
import Button from '@components/Button';
import FixedFooter from '@components/FixedFooter';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import TwoFactorAuthForm from '@components/TwoFactorAuthForm';
import type {BaseTwoFactorAuthFormRef} from '@components/TwoFactorAuthForm/types';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {getLatestErrorMessage} from '@libs/ErrorUtils';
import type {Errors, PendingAction} from '@src/types/onyx/OnyxCommon';
import DomainNotFoundPageWrapper from './DomainNotFoundPageWrapper';

type BaseDomainRequireTwoFactorAuthPageProps = {
    domainAccountID: number;
    onSubmit: (code: string) => void;
    onBackButtonPress: () => void;
    onInputChange?: () => void;
    errors?: Errors;
    pendingAction?: PendingAction;
};

function BaseDomainRequireTwoFactorAuthPage({domainAccountID, onSubmit, onBackButtonPress, onInputChange, errors, pendingAction}: BaseDomainRequireTwoFactorAuthPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const baseTwoFactorAuthRef = useRef<BaseTwoFactorAuthFormRef>(null);

    return (
        <DomainNotFoundPageWrapper domainAccountID={domainAccountID}>
            <ScreenWrapper
                shouldEnableMaxHeight
                shouldUseCachedViewportHeight
                testID={BaseDomainRequireTwoFactorAuthPage.displayName}
                enableEdgeToEdgeBottomSafeAreaPadding
            >
                <HeaderWithBackButton
                    title={translate('twoFactorAuth.disableTwoFactorAuth')}
                    onBackButtonPress={onBackButtonPress}
                    shouldDisplayHelpButton={false}
                />

                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.flexGrow1}
                >
                    <View style={[styles.mh5, styles.mb4, styles.mt3]}>
                        <TwoFactorAuthForm
                            ref={baseTwoFactorAuthRef}
                            shouldAllowRecoveryCode
                            onSubmit={onSubmit}
                            shouldAutoFocus={false}
                            onInputChange={onInputChange}
                            errorMessage={getLatestErrorMessage({errors})}
                        />
                    </View>
                </ScrollView>
                <FixedFooter style={[styles.mt2, styles.pt2]}>
                    <Button
                        success
                        large
                        text={translate('common.disable')}
                        isLoading={!!pendingAction}
                        onPress={() => baseTwoFactorAuthRef.current?.validateAndSubmitForm()}
                    />
                </FixedFooter>
            </ScreenWrapper>
        </DomainNotFoundPageWrapper>
    );
}

BaseDomainRequireTwoFactorAuthPage.displayName = 'BaseDomainRequireTwoFactorAuthPage';

export default BaseDomainRequireTwoFactorAuthPage;
