import React from 'react';
import Button from '@components/Button';
import FixedFooter from '@components/FixedFooter';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';

type MultifactorAuthenticationAuthorizeTransactionActionsProps = {
    onAuthorize: () => void;
    onDeny: () => void;
    isLoading: boolean | undefined;
};

function MultifactorAuthenticationAuthorizeTransactionActions({onAuthorize, onDeny, isLoading}: MultifactorAuthenticationAuthorizeTransactionActionsProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    return (
        <FixedFooter style={[styles.flexRow, styles.gap2]}>
            <Button
                isLoading={isLoading}
                danger
                large
                style={styles.flex1}
                onPress={onDeny}
                text={translate('multifactorAuthentication.reviewTransaction.deny')}
            />
            <Button
                isLoading={isLoading}
                success
                large
                style={styles.flex1}
                onPress={onAuthorize}
                text={translate('multifactorAuthentication.reviewTransaction.approve')}
            />
        </FixedFooter>
    );
}

MultifactorAuthenticationAuthorizeTransactionActions.displayName = 'MultifactorAuthenticationAuthorizeTransactionActions';

export default MultifactorAuthenticationAuthorizeTransactionActions;
