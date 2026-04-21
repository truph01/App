import {domainNameSelector, groupsSelector, selectSecurityGroupForAccount} from '@selectors/Domain';
import React, {useCallback, useState} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import Button from '@components/Button';
import FixedFooter from '@components/FixedFooter';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import SingleSelectListItem from '@components/SelectionList/ListItem/SingleSelectListItem';
import type {ListItem} from '@components/SelectionList/ListItem/types';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import {changeDomainSecurityGroup} from '@libs/actions/Domain';
import {getLoginByAccountID} from '@libs/PersonalDetailsUtils';
import Navigation from '@navigation/Navigation';
import type {PlatformStackScreenProps} from '@navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@navigation/types';
import DomainNotFoundPageWrapper from '@pages/domain/DomainNotFoundPageWrapper';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {Domain} from '@src/types/onyx';

type SecurityGroupItem = ListItem & {
    value: string;
};

type MemberChangeGroupPageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.DOMAIN.MEMBER_CHANGE_GROUP>;

function MemberChangeGroupPage({route}: MemberChangeGroupPageProps) {
    const {domainAccountID, accountID} = route.params;
    const {translate} = useLocalize();

    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
    const [domainName] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {selector: domainNameSelector});
    const [securityGroups] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {selector: groupsSelector});

    const securityGroupSelector = useCallback((domain: OnyxEntry<Domain>) => selectSecurityGroupForAccount(accountID)(domain), [accountID]);
    const [userSecurityGroup] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN}${domainAccountID}`, {
        selector: securityGroupSelector,
    });

    const currentGroupId = userSecurityGroup?.key.replace(CONST.DOMAIN.DOMAIN_SECURITY_GROUP_PREFIX, '');

    const data: SecurityGroupItem[] = (securityGroups ?? []).map(({id, details}) => ({
        text: details.name ?? '',
        keyForList: id,
        value: id,
        isSelected: id === (selectedGroupId ?? currentGroupId),
    }));

    const handleSelectRow = (item: SecurityGroupItem) => {
        setSelectedGroupId(item.value);
    };

    const handleSave = () => {
        if (!selectedGroupId || !domainName || !userSecurityGroup) {
            return;
        }

        if (selectedGroupId === currentGroupId) {
            Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
            return;
        }

        const memberLogin = getLoginByAccountID(accountID);
        if (!memberLogin) {
            return;
        }

        const newSecurityGroupKey: `${typeof CONST.DOMAIN.DOMAIN_SECURITY_GROUP_PREFIX}${string}` = `${CONST.DOMAIN.DOMAIN_SECURITY_GROUP_PREFIX}${selectedGroupId}`;
        changeDomainSecurityGroup(domainAccountID, domainName, memberLogin, accountID, userSecurityGroup.key, userSecurityGroup.securityGroup, newSecurityGroupKey);
        Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
    };

    return (
        <DomainNotFoundPageWrapper domainAccountID={domainAccountID}>
            <ScreenWrapper
                shouldEnableMaxHeight
                testID="MemberChangeGroupPage"
                includeSafeAreaPaddingBottom
            >
                <HeaderWithBackButton
                    title={translate('domain.members.securityGroup')}
                    onBackButtonPress={() => {
                        Navigation.goBack(ROUTES.DOMAIN_MEMBER_DETAILS.getRoute(domainAccountID, accountID));
                    }}
                />
                <SelectionList<SecurityGroupItem>
                    data={data}
                    onSelectRow={handleSelectRow}
                    ListItem={SingleSelectListItem}
                    initiallyFocusedItemKey={currentGroupId}
                />
                <FixedFooter>
                    <Button
                        success
                        large
                        pressOnEnter
                        text={translate('common.save')}
                        onPress={handleSave}
                        isDisabled={!selectedGroupId || selectedGroupId === currentGroupId}
                    />
                </FixedFooter>
            </ScreenWrapper>
        </DomainNotFoundPageWrapper>
    );
}

export default MemberChangeGroupPage;
