import {domainMemberSettingsSelector} from '@selectors/Domain';
import {personalDetailsSelector} from '@selectors/PersonalDetails';
import React, {useEffect} from 'react';
import useOnyx from '@hooks/useOnyx';
import Navigation from '@navigation/Navigation';
import type {PlatformStackScreenProps} from '@navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@navigation/types';
import BaseDomainRequireTwoFactorAuthPage from '@pages/domain/BaseDomainRequireTwoFactorAuthPage';
import {clearTwoFactorAuthExemptEmailsErrors, setTwoFactorAuthExemptEmailForDomain} from '@userActions/Domain';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import {isEmptyObject} from '@src/types/utils/EmptyObject';

type DomainMemberForceTwoFactorAuthPageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.DOMAIN.MEMBER_FORCE_TWO_FACTOR_AUTH>;

function DomainMemberForceTwoFactorAuthPage({route}: DomainMemberForceTwoFactorAuthPageProps) {
    const {domainAccountID, accountID} = route.params;

    const [personalDetails] = useOnyx(ONYXKEYS.PERSONAL_DETAILS_LIST, {
        canBeMissing: true,
        selector: personalDetailsSelector(accountID),
    });
    const memberLogin = personalDetails?.login ?? '';
    const [domainSettings] = useOnyx(`${ONYXKEYS.COLLECTION.SHARED_NVP_PRIVATE_DOMAIN_MEMBER}${domainAccountID}`, {
        canBeMissing: false,
        selector: domainMemberSettingsSelector,
    });
    const [domainErrors] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_ERRORS}${domainAccountID}`, {
        canBeMissing: true,
    });
    const [domainPendingActions] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_PENDING_ACTIONS}${domainAccountID}`, {
        canBeMissing: true,
    });

    useEffect(() => {
        if (!domainSettings?.twoFactorAuthExemptEmails?.includes(memberLogin)) {
            return;
        }
        Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
    }, [accountID, domainAccountID, domainSettings?.twoFactorAuthExemptEmails, memberLogin]);

    return (
        <BaseDomainRequireTwoFactorAuthPage
            domainAccountID={domainAccountID}
            onSubmit={(code: string) => {
                if (!personalDetails?.login) {
                    return;
                }

                setTwoFactorAuthExemptEmailForDomain(domainAccountID, accountID, domainSettings?.twoFactorAuthExemptEmails ?? [], personalDetails.login, false, code);
            }}
            onBackButtonPress={() => {
                Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
            }}
            onInputChange={() => {
                if (isEmptyObject(domainErrors?.memberErrors?.[memberLogin]?.twoFactorAuthExemptEmailsError)) {
                    return;
                }
                clearTwoFactorAuthExemptEmailsErrors(domainAccountID, memberLogin);
            }}
            errors={domainErrors?.memberErrors?.[memberLogin]?.twoFactorAuthExemptEmailsError}
            pendingAction={domainPendingActions?.member?.[accountID]?.twoFactorAuthExemptEmails}
        />
    );
}

DomainMemberForceTwoFactorAuthPage.displayName = 'DomainMemberForceTwoFactorAuthPage';

export default DomainMemberForceTwoFactorAuthPage;
