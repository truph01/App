import {domainMemberSettingsSelector} from '@selectors/Domain';
import {Str} from 'expensify-common';
import React from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import Avatar from '@components/Avatar';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MenuItem from '@components/MenuItem';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Text from '@components/Text';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {getLatestError} from '@libs/ErrorUtils';
import {getDisplayNameOrDefault, getPhoneNumber} from '@libs/PersonalDetailsUtils';
import Navigation from '@navigation/Navigation';
import EnabledPage from '@pages/settings/Security/TwoFactorAuth/EnabledPage';
import ToggleSettingOptionRow from '@pages/workspace/workflows/ToggleSettingsOptionRow';
import {clearTwoFactorAuthExemptEmailsErrors, setTwoFactorAuthExemptEmailForDomain} from '@userActions/Domain';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {PersonalDetailsList} from '@src/types/onyx';
import DomainNotFoundPageWrapper from './DomainNotFoundPageWrapper';

type BaseDomainMemberDetailsComponentProps = {
    /** Domain ID */
    domainAccountID: number;

    /** User account ID */
    accountID: number;

    /** List of additional fields (e.g., force 2FA) */
    children?: React.ReactNode;
};

function BaseDomainMemberDetailsComponent({domainAccountID, accountID, children}: BaseDomainMemberDetailsComponentProps) {
    const styles = useThemeStyles();
    const {translate, formatPhoneNumber} = useLocalize();
    const icons = useMemoizedLazyExpensifyIcons(['Info', 'Flag']);

    const [domainPendingActions] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_PENDING_ACTIONS}${domainAccountID}`, {
        canBeMissing: true,
    });
    const [domainErrors] = useOnyx(`${ONYXKEYS.COLLECTION.DOMAIN_ERRORS}${domainAccountID}`, {
        canBeMissing: true,
    });
    const [domainSettings] = useOnyx(`${ONYXKEYS.COLLECTION.SHARED_NVP_PRIVATE_DOMAIN_MEMBER}${domainAccountID}`, {
        canBeMissing: false,
        selector: domainMemberSettingsSelector,
    });
    const [account] = useOnyx(ONYXKEYS.ACCOUNT);

    // The selector depends on the dynamic `accountID`, so it cannot be extracted
    // to a static function outside the component.
    // eslint-disable-next-line rulesdir/no-inline-useOnyx-selector
    const [personalDetails] = useOnyx(ONYXKEYS.PERSONAL_DETAILS_LIST, {
        canBeMissing: true,
        selector: (personalDetailsList: OnyxEntry<PersonalDetailsList>) => personalDetailsList?.[accountID],
    });

    const displayName = formatPhoneNumber(getDisplayNameOrDefault(personalDetails));
    const phoneNumber = getPhoneNumber(personalDetails);
    const memberLogin = personalDetails?.login ?? '';
    const isSMSLogin = Str.isSMSLogin(memberLogin);
    const copyableName = isSMSLogin ? formatPhoneNumber(phoneNumber ?? '') : memberLogin;

    return (
        <DomainNotFoundPageWrapper domainAccountID={domainAccountID}>
            <ScreenWrapper
                enableEdgeToEdgeBottomSafeAreaPadding
                testID={BaseDomainMemberDetailsComponent.displayName}
            >
                <HeaderWithBackButton title={displayName} />

                <ScrollView addBottomSafeAreaPadding>
                    <View style={[styles.containerWithSpaceBetween, styles.pointerEventsBoxNone, styles.justifyContentStart]}>
                        <View style={[styles.avatarSectionWrapper, styles.pb0]}>
                            <OfflineWithFeedback pendingAction={personalDetails?.pendingFields?.avatar}>
                                <Avatar
                                    containerStyles={[styles.avatarXLarge, styles.mb4, styles.noOutline]}
                                    imageStyles={[styles.avatarXLarge]}
                                    source={personalDetails?.avatar}
                                    avatarID={accountID}
                                    type={CONST.ICON_TYPE_AVATAR}
                                    size={CONST.AVATAR_SIZE.X_LARGE}
                                    fallbackIcon={personalDetails?.fallbackIcon}
                                />
                            </OfflineWithFeedback>

                            {!!displayName && (
                                <Text
                                    style={[styles.textHeadline, styles.pre, styles.mb8, styles.w100, styles.textAlignCenter]}
                                    numberOfLines={1}
                                >
                                    {displayName}
                                </Text>
                            )}
                        </View>
                        <View style={styles.w100}>
                            <MenuItemWithTopDescription
                                title={copyableName}
                                copyValue={copyableName}
                                description={translate(isSMSLogin ? 'common.phoneNumber' : 'common.email')}
                                interactive={false}
                                copyable
                            />
                            {children}
                            <ToggleSettingOptionRow
                                wrapperStyle={[styles.mv3, styles.ph5]}
                                switchAccessibilityLabel={translate('domain.common.forceTwoFactorAuth')}
                                isActive={!!domainSettings?.twoFactorAuthExemptEmails?.includes(memberLogin)}
                                onToggle={(value) => {
                                    if (!personalDetails?.login) {
                                        return;
                                    }
                                    setTwoFactorAuthExemptEmailForDomain(domainAccountID, accountID, domainSettings?.twoFactorAuthExemptEmails ?? [], personalDetails?.login, value);
                                }}
                                title={translate('domain.common.forceTwoFactorAuth')}
                                pendingAction={domainPendingActions?.member?.[accountID]?.twoFactorAuthExemptEmails}
                                errors={getLatestError(domainErrors?.memberErrors?.[accountID]?.twoFactorAuthExemptEmailsError)}
                                onCloseError={() => clearTwoFactorAuthExemptEmailsErrors(domainAccountID, accountID)}
                            />

                            {!!account?.requiresTwoFactorAuth && (
                                <MenuItem
                                    style={styles.mb5}
                                    title={translate('domain.common.resetTwoFactorAuth')}
                                    icon={icons.Flag}
                                    onPress={() => Navigation.navigate(ROUTES.DOMAIN_MEMBER_TWO_FACTOR_AUTH.getRoute(domainAccountID, accountID))}
                                />
                            )}
                            <MenuItem
                                style={styles.mb5}
                                title={translate('common.profile')}
                                icon={icons.Info}
                                onPress={() => Navigation.navigate(ROUTES.PROFILE.getRoute(accountID, Navigation.getActiveRoute()))}
                                shouldShowRightIcon
                            />
                        </View>
                    </View>
                </ScrollView>
            </ScreenWrapper>
        </DomainNotFoundPageWrapper>
    );
}

BaseDomainMemberDetailsComponent.displayName = 'BaseDomainMemberDetailsComponent';

export default BaseDomainMemberDetailsComponent;
