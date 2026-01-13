import {domainNameSelector} from '@selectors/Domain';
import React from 'react';
import useOnyx from '@hooks/useOnyx';
import Navigation from '@navigation/Navigation';
import type {PlatformStackScreenProps} from '@navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@navigation/types';
import {toggleTwoFactorAuthRequiredForDomain} from '@userActions/Domain';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import BaseDomainRequireTwoFactorAuthPage from './BaseDomainRequireTwoFactorAuthPage';

type DomainMemberTwoFactorAuthPageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.DOMAIN.MEMBER_TWO_FACTOR_AUTH>;

function DomainMemberTwoFactorAuthPage({route}: DomainMemberTwoFactorAuthPageProps) {
    const {domainAccountID, accountID} = route.params;

    const [domainName] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {canBeMissing: true, selector: domainNameSelector});

    return (
        <BaseDomainRequireTwoFactorAuthPage
            domainAccountID={domainAccountID}
            onSubmit={(code: string) => {
                if (!domainName) {
                    return;
                }

                toggleTwoFactorAuthRequiredForDomain(domainAccountID, domainName, false, code);
                Navigation.goBack(ROUTES.DOMAIN_MEMBER_TWO_FACTOR_AUTH.getRoute(domainAccountID, accountID));
            }}
            onBackButtonPress={() => {
                Navigation.goBack(ROUTES.DOMAIN_MEMBER_TWO_FACTOR_AUTH.getRoute(domainAccountID, accountID));
            }}
        />
    );
}

DomainMemberTwoFactorAuthPage.displayName = 'DomainMemberTwoFactorAuthPage';

export default DomainMemberTwoFactorAuthPage;
