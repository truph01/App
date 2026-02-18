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
import useOnyx from '@hooks/useOnyx';
import ONYXKEYS from '@src/ONYXKEYS';
import {denyTransaction} from '@libs/actions/MultifactorAuthentication';
import {DefaultClientFailureScreen} from '@components/MultifactorAuthentication/components/OutcomeScreen';
import MultifactorAuthenticationAuthorizeTransactionActions from './AuthorizeTransactionActions';
import MultifactorAuthenticationAuthorizeTransactionContent from './AuthorizeTransactionContent';

type MultifactorAuthenticationAuthorizeTransactionPageProps = PlatformStackScreenProps<MultifactorAuthenticationParamList, typeof SCREENS.MULTIFACTOR_AUTHENTICATION.AUTHORIZE_TRANSACTION>;

function MultifactorAuthenticationScenarioAuthorizeTransactionPage({route}: MultifactorAuthenticationAuthorizeTransactionPageProps) {
    const transactionID = route.params.transactionID;

    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const [transactionDenied, setTransactionDenied] = useState(false);

    const [transactionQueue] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true});
    const transaction = transactionQueue?.[transactionID];

    const {executeScenario} = useMultifactorAuthentication();

    const [isConfirmModalVisible, setConfirmModalVisibility] = useState(false);

    const showConfirmModal = () => {
        if (!transaction) {
            // This is the event handler for the user pressing "back" in the Header
            // if the transaction has disappeared from state at this point, just close the RHP immediately
            Navigation.closeRHPFlow();
        }
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

    const onDenyTransaction = () => {
        if (isConfirmModalVisible || !transactionID) {
            hideConfirmModal();
        }

        denyTransaction({transactionID}).then(() => setTransactionDenied(true));
        // TODO: Set state (add a new useState at the top) here that the outcome page should be displayed instead of closing the flow
        // CHUCK NOTE: I have done what I interpreted this to mean
    };

    if (transactionDenied) {
        return (
            <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
                {/* WIP this'll be replaced with the proper outcome screen after we merge the error screens PR */}
                <DefaultClientFailureScreen />
            </ScreenWrapper>
        );
    }

    if (!transaction) {
        return (
            <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
                {/* WIP this'll be replaced with the proper outcome screen after we merge the error screens PR */}
                <DefaultClientFailureScreen />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
            <HeaderWithBackButton
                title={translate('multifactorAuthentication.reviewTransaction.reviewTransaction')}
                onBackButtonPress={showConfirmModal}
                shouldShowBackButton
            />
            <FullPageOfflineBlockingView>
                <View style={[styles.flex1, styles.flexColumn, styles.justifyContentBetween]}>
                    <MultifactorAuthenticationAuthorizeTransactionContent transaction={transaction} />
                    <MultifactorAuthenticationAuthorizeTransactionActions
                        isLoading={transaction.isLoading}
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
                        onConfirm={onDenyTransaction}
                        onCancel={hideConfirmModal}
                    />
                </View>
            </FullPageOfflineBlockingView>
        </ScreenWrapper>
    );
}

MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName = 'MultifactorAuthenticationScenarioAuthorizeTransactionPage';

export default MultifactorAuthenticationScenarioAuthorizeTransactionPage;
