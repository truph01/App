import React, {useCallback} from 'react';
import {View} from 'react-native';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import ONYXKEYS from '@src/ONYXKEYS';
import type {OnyxEntry} from 'react-native-onyx';
import type {TransactionsPending3DSReview} from '@src/types/onyx';
import AuthorizeCardTransactionPreview from './AuthorizeCardTransactionPreview';

type MultifactorAuthenticationAuthorizeTransactionContentProps = {
    transactionID: string;
};

function MultifactorAuthenticationAuthorizeTransactionContent({transactionID}: MultifactorAuthenticationAuthorizeTransactionContentProps) {
    const pendingTransactionSelector = useCallback(
        (transactions: OnyxEntry<TransactionsPending3DSReview>) => {
            if (!transactions) {
                return undefined;
            }

            const entries = Object.entries(transactions);

            const [, foundTransaction] = entries.find(([reviewTransactionID]) => reviewTransactionID === transactionID) ?? [];

            return foundTransaction;
        },
        [transactionID],
    );

    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [transaction] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {
        canBeMissing: true,
        selector: pendingTransactionSelector,
    });

    return (
        <View style={styles.mh5}>
            <View style={[styles.gap2, styles.mb6]}>
                <Text style={styles.textHeadlineLineHeightXXL}>{translate('multifactorAuthentication.reviewTransaction.pleaseReview')}</Text>
                <Text style={styles.textSupporting}>{translate('multifactorAuthentication.reviewTransaction.requiresYourReview')}</Text>
            </View>
            <View style={styles.mb2}>
                <Text style={styles.textMicroSupporting}>{translate('multifactorAuthentication.reviewTransaction.transactionDetails')}</Text>
            </View>
            <AuthorizeCardTransactionPreview
                transactionID={transactionID}
                amount={transaction?.amount}
                currency={transaction?.currency}
                merchant={transaction?.merchant}
                created={transaction?.created}
                lastFourPAN={transaction?.lastFourPAN}
            />
        </View>
    );
}

MultifactorAuthenticationAuthorizeTransactionContent.displayName = 'MultifactorAuthenticationAuthorizeTransactionContent';

export default MultifactorAuthenticationAuthorizeTransactionContent;
