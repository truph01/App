import React, {useState} from 'react';
import {View} from 'react-native';
import FullPageOfflineBlockingView from '@components/BlockingViews/FullPageOfflineBlockingView';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MultifactorAuthenticationTriggerCancelConfirmModal from '@components/MultifactorAuthentication/TriggerCancelConfirmModal';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {MultifactorAuthenticationParamList} from '@libs/Navigation/types';
import Navigation from '@navigation/Navigation';
import type SCREENS from '@src/SCREENS';
import CONST from '@src/CONST';
import {useMultifactorAuthentication} from '@components/MultifactorAuthentication/Context';
import MultifactorAuthenticationAuthorizeTransactionActions from './AuthorizeTransactionActions';
import MultifactorAuthenticationAuthorizeTransactionContent from './AuthorizeTransactionContent';

type MultifactorAuthenticationAuthorizeTransactionPageProps = PlatformStackScreenProps<MultifactorAuthenticationParamList, typeof SCREENS.MULTIFACTOR_AUTHENTICATION.AUTHORIZE_TRANSACTION>;

function MultifactorAuthenticationScenarioAuthorizeTransactionPage({route}: MultifactorAuthenticationAuthorizeTransactionPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    // TODO: Listen for the Onyx key here and if the transaction details are missing, then render the 'already review' component instead

    const {executeScenario} = useMultifactorAuthentication();

    const transactionID = route.params.transactionID;
    const [isConfirmModalVisible, setConfirmModalVisibility] = useState(false);

    const showConfirmModal = () => {
        setConfirmModalVisibility(true);
    };

    const hideConfirmModal = () => {
        setConfirmModalVisibility(false);
    };

    const approveTransaction = () => {
        executeScenario(CONST.MULTIFACTOR_AUTHENTICATION.SCENARIO.AUTHORIZE_TRANSACTION, {
            transactionID,
        });
    };

    const denyTransaction = () => {
        if (isConfirmModalVisible) {
            hideConfirmModal();
        }
        // TODO: Use DenyTransaction - API for denying, same for ValidateCodePage
        // TODO: Set state (add a new useState at the top) here that the outcome page should be displayed instead of closing the flow
        Navigation.closeRHPFlow();
    };

    // TODO: Instead of navigate to outcome page, if the state above is true then render failure component here

    return (
        <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
            <HeaderWithBackButton
                title={translate('multifactorAuthentication.reviewTransaction.reviewTransaction')}
                onBackButtonPress={showConfirmModal}
                shouldShowBackButton
            />
            <FullPageOfflineBlockingView>
                <View style={[styles.flex1, styles.flexColumn, styles.justifyContentBetween]}>
                    <MultifactorAuthenticationAuthorizeTransactionContent transactionID={transactionID} />
                    <MultifactorAuthenticationAuthorizeTransactionActions
                        onAuthorize={approveTransaction}
                        onDeny={showConfirmModal}
                    />
                    {/*
                        TODO: Use custom AuthorizeTransactionCancelModal (not yet implemented)
                        The config for MFA modals should be exactly the same as `failureScreens` structure.
                        Right now only the props for modals are stored in the config but it should be key - component pattern instead.
                        See: FailureScreen directory and how it is used in the scenarios config.
                    */}
                    <MultifactorAuthenticationTriggerCancelConfirmModal
                        isVisible={isConfirmModalVisible}
                        onConfirm={denyTransaction}
                        onCancel={hideConfirmModal}
                    />
                </View>
            </FullPageOfflineBlockingView>
        </ScreenWrapper>
    );
}

MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName = 'MultifactorAuthenticationScenarioAuthorizeTransactionPage';

export default MultifactorAuthenticationScenarioAuthorizeTransactionPage;
