import {defaultSecurityGroupIDSelector, memberAccountIDsSelector, memberPendingActionSelector} from '@selectors/Domain';
import React from 'react';
import Button from '@components/Button';
import {useMemoizedLazyExpensifyIcons, useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import {clearDomainMemberError} from '@libs/actions/Domain';
import {hasDomainMemberDetailsErrors} from '@libs/DomainUtils';
import {getLatestError} from '@libs/ErrorUtils';
import Navigation from '@navigation/Navigation';
import type {PlatformStackScreenProps} from '@navigation/PlatformStackNavigation/types';
import type {DomainSplitNavigatorParamList} from '@navigation/types';
import BaseDomainMembersPage from '@pages/domain/BaseDomainMembersPage';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {DomainMemberErrors} from '@src/types/onyx/DomainErrors';

type DomainMembersPageProps = PlatformStackScreenProps<DomainSplitNavigatorParamList, typeof SCREENS.DOMAIN.MEMBERS>;

function DomainMembersPage({route}: DomainMembersPageProps) {
    const {domainAccountID} = route.params;
    const {translate} = useLocalize();
    const illustrations = useMemoizedLazyIllustrations(['Profile']);
    const icons = useMemoizedLazyExpensifyIcons(['Plus', 'Gear', 'DotIndicator']);
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const styles = useThemeStyles();

    const [domainErrors] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_ERRORS}${domainAccountID}`, {canBeMissing: true});
    const [domainPendingActions] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_PENDING_ACTIONS}${domainAccountID}`, {canBeMissing: true, selector: memberPendingActionSelector});
    const [defaultSecurityGroupID] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {canBeMissing: true, selector: defaultSecurityGroupIDSelector});

    const [memberIDs] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {
        canBeMissing: true,
        selector: memberAccountIDsSelector,
    });

    const headerContent = (
        <Button
            success
            onPress={() => Navigation.navigate(ROUTES.DOMAIN_ADD_MEMBER.getRoute(domainAccountID))}
            text={translate('domain.members.addMember')}
            icon={icons.Plus}
            innerStyles={[shouldUseNarrowLayout && styles.alignItemsCenter]}
            style={shouldUseNarrowLayout ? [styles.flexGrow1, styles.mb3] : undefined}
        />
    );

    const getCustomRowProps = (accountID: number, email?: string) => {
        const emailPendingAction = email ? domainPendingActions?.[email]?.pendingAction : undefined;
        const accountIDPendingAction = domainPendingActions?.[accountID]?.pendingAction;

        const emailErrors = email ? domainErrors?.memberErrors?.[email] : undefined;
        const accountIDErrors = domainErrors?.memberErrors?.[accountID];
        const mergedErrors: DomainMemberErrors = {
            errors: {...accountIDErrors?.errors, ...emailErrors?.errors},
            vacationDelegateErrors: {...accountIDErrors?.vacationDelegateErrors, ...emailErrors?.vacationDelegateErrors},
        };
        const brickRoadIndicator = hasDomainMemberDetailsErrors(mergedErrors) ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined;

        return {errors: getLatestError(mergedErrors?.errors), pendingAction: emailPendingAction ?? accountIDPendingAction, brickRoadIndicator};
    };

    return (
        <BaseDomainMembersPage
            domainAccountID={domainAccountID}
            accountIDs={memberIDs ?? []}
            headerTitle={translate('domain.members.title')}
            searchPlaceholder={translate('domain.members.findMember')}
            onSelectRow={(item) => Navigation.navigate(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, item.accountID))}
            headerIcon={illustrations.Profile}
            getCustomRowProps={getCustomRowProps}
            headerContent={headerContent}
            onDismissError={(item) => {
                if (!defaultSecurityGroupID) {
                    return;
                }
                clearDomainMemberError(domainAccountID, item.accountID, item.login, defaultSecurityGroupID, item.pendingAction);
            }}
        />
    );
}

export default DomainMembersPage;
