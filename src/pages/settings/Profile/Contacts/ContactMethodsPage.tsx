import {isUserValidatedSelector} from '@selectors/Account';
import React, {useCallback, useContext, useMemo} from 'react';
import {AccessibilityInfo, View} from 'react-native';
import Button from '@components/Button';
import {DelegateNoAccessContext} from '@components/DelegateNoAccessModalProvider';
import FixedFooter from '@components/FixedFooter';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import {LockedAccountContext} from '@components/LockedAccountModalProvider';
import MenuItem from '@components/MenuItem';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import PressableWithoutFeedback from '@components/Pressable/PressableWithoutFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import Clipboard from '@libs/Clipboard';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import {getContactMethodsOptions} from '@libs/UserUtils';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

type ContactMethodsPageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.SETTINGS.PROFILE.CONTACT_METHODS>;

function ContactMethodsPage({route}: ContactMethodsPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [loginList] = useOnyx(ONYXKEYS.LOGIN_LIST, {canBeMissing: false});
    const [session] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: false});
    const navigateBackTo = route?.params?.backTo;

    const {isActingAsDelegate, showDelegateNoAccessModal} = useContext(DelegateNoAccessContext);
    const [isUserValidated] = useOnyx(ONYXKEYS.ACCOUNT, {selector: isUserValidatedSelector, canBeMissing: false});
    const {isAccountLocked, showLockedAccountModal} = useContext(LockedAccountContext);

    const options = useMemo(() => getContactMethodsOptions(translate, loginList, session?.email), [translate, loginList, session?.email]);

    const copyEmailToClipboard = useCallback(() => {
        Clipboard.setString(CONST.EMAIL.RECEIPTS);
        AccessibilityInfo.announceForAccessibility(translate('common.copied'));
    }, [translate]);

    const onNewContactMethodButtonPress = useCallback(() => {
        if (isActingAsDelegate) {
            showDelegateNoAccessModal();
            return;
        }
        if (isAccountLocked) {
            showLockedAccountModal();
            return;
        }

        if (!isUserValidated) {
            Navigation.navigate(
                ROUTES.SETTINGS_CONTACT_METHOD_VERIFY_ACCOUNT.getRoute(Navigation.getActiveRoute(), ROUTES.SETTINGS_NEW_CONTACT_METHOD_CONFIRM_MAGIC_CODE.getRoute(navigateBackTo)),
            );
            return;
        }
        Navigation.navigate(ROUTES.SETTINGS_NEW_CONTACT_METHOD_CONFIRM_MAGIC_CODE.getRoute(navigateBackTo));
    }, [navigateBackTo, isActingAsDelegate, showDelegateNoAccessModal, isAccountLocked, isUserValidated, showLockedAccountModal]);

    return (
        <ScreenWrapper
            shouldEnableKeyboardAvoidingView={false}
            testID="ContactMethodsPage"
        >
            <HeaderWithBackButton
                title={translate('contacts.contactMethods')}
                onBackButtonPress={() => Navigation.goBack()}
            />
            <ScrollView contentContainerStyle={styles.flexGrow1}>
                <View style={[styles.ph5, styles.mv3]}>
                    <Text style={[styles.textNormal, styles.textSupporting]}>
                        {translate('contacts.helpTextLine1')}
                    </Text>
                    <Text style={[styles.textNormal, styles.textSupporting, styles.mt3]}>
                        {translate('contacts.helpTextBeforeEmail')}
                        <PressableWithoutFeedback
                            accessible
                            accessibilityRole={CONST.ROLE.BUTTON}
                            accessibilityLabel={`${CONST.EMAIL.RECEIPTS}, ${translate('common.copyToClipboard')}`}
                            onPress={copyEmailToClipboard}
                            style={[styles.flexRow, styles.alignItemsCenter, styles.dInlineFlex, styles.pr1]}
                        >
                            <Text style={[styles.textNormal, styles.link]}>{CONST.EMAIL.RECEIPTS}</Text>
                            <Icon
                                src={Expensicons.Copy}
                                width={variables.iconSizeSmall}
                                height={variables.iconSizeSmall}
                                inline
                            />
                        </PressableWithoutFeedback>
                        {translate('contacts.helpTextAfterEmail')}
                    </Text>
                </View>
                {options.map(
                    (option) =>
                        !!option && (
                            <OfflineWithFeedback
                                pendingAction={option.pendingAction}
                                key={option.partnerUserID}
                            >
                                <MenuItem
                                    title={option.menuItemTitle}
                                    description={option.description}
                                    onPress={() => Navigation.navigate(ROUTES.SETTINGS_CONTACT_METHOD_DETAILS.getRoute(option.partnerUserID, navigateBackTo))}
                                    brickRoadIndicator={option.indicator}
                                    shouldShowBasicTitle
                                    shouldShowRightIcon
                                    disabled={!!option.pendingAction}
                                />
                            </OfflineWithFeedback>
                        ),
                )}
                <FixedFooter style={[styles.mtAuto, styles.pt5]}>
                    <Button
                        large
                        success
                        text={translate('contacts.newContactMethod')}
                        onPress={onNewContactMethodButtonPress}
                        pressOnEnter
                    />
                </FixedFooter>
            </ScrollView>
        </ScreenWrapper>
    );
}

export default ContactMethodsPage;
