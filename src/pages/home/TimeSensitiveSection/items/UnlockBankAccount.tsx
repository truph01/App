import React from 'react';
import BaseWidgetItem from '@components/BaseWidgetItem';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import {pressLockedBankAccount} from '@libs/actions/BankAccounts';
import Navigation from '@libs/Navigation/Navigation';
import colors from '@styles/theme/colors';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';

type UnlockBankAccountProps = {
    /** The ID of the locked bank account */
    bankAccountID: number;

    /** The policy name — undefined means personal account (subtitle: 'Wallet') */
    policyName?: string;
};

function UnlockBankAccount({bankAccountID, policyName}: UnlockBankAccountProps) {
    const {translate} = useLocalize();
    const icons = useMemoizedLazyExpensifyIcons(['Bank']);
    const [conciergeReportID] = useOnyx(ONYXKEYS.CONCIERGE_REPORT_ID);

    const title = policyName ? translate('homePage.timeSensitiveSection.unlockBankAccount.workspaceTitle') : translate('homePage.timeSensitiveSection.unlockBankAccount.personalTitle');

    const subtitle = policyName
        ? translate('homePage.timeSensitiveSection.unlockBankAccount.workspaceSubtitle', {policyName})
        : translate('homePage.timeSensitiveSection.unlockBankAccount.personalSubtitle');

    const handleCtaPress = () => {
        pressLockedBankAccount(bankAccountID, translate, conciergeReportID);
        if (conciergeReportID) {
            Navigation.navigate(ROUTES.REPORT_WITH_ID.getRoute(conciergeReportID));
        }
    };

    return (
        <BaseWidgetItem
            icon={icons.Bank}
            iconBackgroundColor={colors.tangerine100}
            iconFill={colors.tangerine500}
            title={title}
            subtitle={subtitle}
            ctaText={translate('homePage.timeSensitiveSection.ctaFix')}
            onCtaPress={handleCtaPress}
            buttonProps={{danger: true}}
        />
    );
}

export default UnlockBankAccount;
