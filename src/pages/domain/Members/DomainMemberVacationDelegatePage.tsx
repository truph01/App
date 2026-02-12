import React from 'react';
import BaseVacationDelegateSelectionComponent from '@components/BaseVacationDelegateSelectionComponent';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import Navigation from '@libs/Navigation/Navigation';
import {getLoginByAccountID} from '@libs/PersonalDetailsUtils';
import type {PlatformStackScreenProps} from '@navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@navigation/types';
import DomainNotFoundPageWrapper from '@pages/domain/DomainNotFoundPageWrapper';
import {deleteDomainVacationDelegate, setDomainVacationDelegate} from '@userActions/Domain';
import {getCurrentUserEmail} from '@userActions/IOU';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {Participant} from '@src/types/onyx/IOU';
import useVacationDelegate from './hooks/useVacationDelegate';

type DomainMemberVacationDelegatePageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.DOMAIN.VACATION_DELEGATE>;

function DomainMemberVacationDelegatePage({route}: DomainMemberVacationDelegatePageProps) {
    const {domainAccountID, accountID} = route.params;
    const {translate} = useLocalize();

    const currentUserEmail = getCurrentUserEmail();

    const vacationDelegate = useVacationDelegate(domainAccountID, accountID);

    const onSelectRow = (option: Participant) => {
        const memberLogin = getLoginByAccountID(accountID);
        const delegateLogin = option?.login;

        if (!memberLogin || !delegateLogin) {
            return;
        }

        if (delegateLogin === vacationDelegate?.delegate) {
            deleteDomainVacationDelegate(domainAccountID, accountID, memberLogin, vacationDelegate);
            Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
            return;
        }

        setDomainVacationDelegate(domainAccountID, accountID, currentUserEmail, memberLogin, delegateLogin, vacationDelegate);
        Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
    };

    return (
        <DomainNotFoundPageWrapper domainAccountID={domainAccountID}>
            <ScreenWrapper
                enableEdgeToEdgeBottomSafeAreaPadding
                testID="DomainMemberVacationDelegate"
            >
                <BaseVacationDelegateSelectionComponent
                    vacationDelegate={vacationDelegate}
                    headerTitle={translate('common.vacationDelegate')}
                    onSelectRow={onSelectRow}
                    onBackButtonPress={() => Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID))}
                    cannotSetDelegateMessage={translate('domain.members.cannotSetVacationDelegateForMember', getLoginByAccountID(accountID) ?? '')}
                />
            </ScreenWrapper>
        </DomainNotFoundPageWrapper>
    );
}

export default DomainMemberVacationDelegatePage;
