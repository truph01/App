import React, {useState} from 'react';
import {View} from 'react-native';
import FullPageOfflineBlockingView from '@components/BlockingViews/FullPageOfflineBlockingView';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {MultifactorAuthenticationParamList} from '@libs/Navigation/types';
import type SCREENS from '@src/SCREENS';
import CONST from '@src/CONST';
import {useMultifactorAuthentication} from '@components/MultifactorAuthentication/Context';
import useOnyx from '@hooks/useOnyx';
import ONYXKEYS from '@src/ONYXKEYS';
import {denyTransaction, fireAndForgetDenyTransaction} from '@libs/actions/MultifactorAuthentication';
import {AlreadyReviewedFailureScreen, DeniedTransactionSuccessScreen} from '@components/MultifactorAuthentication/config/scenarios/AuthorizeTransaction';
import {AuthorizeTransactionCancelConfirmModal} from '@components/MultifactorAuthentication/components/Modals';
import Navigation from '@libs/Navigation/Navigation';
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
        denyTransaction({transactionID}).then(() => setTransactionDenied(true));
    };

    const onSilentlyDenyTransaction = () => {
        fireAndForgetDenyTransaction({transactionID});
        Navigation.closeRHPFlow();
    };

    if (transactionDenied) {
        return (
            <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
                <DeniedTransactionSuccessScreen />
            </ScreenWrapper>
        );
    }

    if (!transaction) {
        return (
            <ScreenWrapper testID={MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName}>
                <AlreadyReviewedFailureScreen />
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
                        onDeny={onDenyTransaction}
                    />
                    <AuthorizeTransactionCancelConfirmModal
                        isVisible={isConfirmModalVisible}
                        onConfirm={onSilentlyDenyTransaction}
                        onCancel={hideConfirmModal}
                    />
                </View>
            </FullPageOfflineBlockingView>
        </ScreenWrapper>
    );
}

MultifactorAuthenticationScenarioAuthorizeTransactionPage.displayName = 'MultifactorAuthenticationScenarioAuthorizeTransactionPage';

export default MultifactorAuthenticationScenarioAuthorizeTransactionPage;
