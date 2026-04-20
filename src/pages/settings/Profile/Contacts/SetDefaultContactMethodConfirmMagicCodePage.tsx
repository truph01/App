import React, {useEffect, useMemo} from 'react';
import ValidateCodeActionContent from '@components/ValidateCodeActionModal/ValidateCodeActionContent';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import {clearContactMethodErrors, requestValidateCodeAction, setContactMethodAsDefault} from '@libs/actions/User';
import {getLatestErrorField} from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import {getContactMethod} from '@libs/UserUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import getDecodedContactMethodFromUriParam from './utils';

type SetDefaultContactMethodConfirmMagicCodePageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.SETTINGS.PROFILE.CONTACT_METHOD_SET_DEFAULT_CONFIRM>;

function SetDefaultContactMethodConfirmMagicCodePage({route}: SetDefaultContactMethodConfirmMagicCodePageProps) {
    const {translate, formatPhoneNumber} = useLocalize();
    const backTo = route.params?.backTo;
    const contactMethod = useMemo(() => getDecodedContactMethodFromUriParam(route.params.contactMethod), [route.params.contactMethod]);
    const [account] = useOnyx(ONYXKEYS.ACCOUNT);
    const [session] = useOnyx(ONYXKEYS.SESSION);
    const [loginList] = useOnyx(ONYXKEYS.LOGIN_LIST);
    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const primaryContactMethod = getContactMethod(account?.primaryLogin, session?.email);

    const loginData = loginList?.[contactMethod];
    const defaultLoginError = getLatestErrorField(loginData, 'defaultLogin');

    // Navigate back to contact methods list when the default login is successfully updated
    useEffect(() => {
        // Wait for the server to confirm the default login change (session.email is updated via successData)
        if (session?.email !== contactMethod || loginData?.pendingFields?.defaultLogin) {
            return;
        }

        Navigation.goBack(ROUTES.SETTINGS_CONTACT_METHODS.getRoute(backTo));
    }, [session?.email, contactMethod, loginData?.pendingFields?.defaultLogin, backTo]);

    return (
        <ValidateCodeActionContent
            title={translate('delegate.makeSureItIsYou')}
            sendValidateCode={() => requestValidateCodeAction()}
            descriptionPrimary={translate('contacts.enterMagicCode', primaryContactMethod)}
            validateCodeActionErrorField="defaultLogin"
            validateError={defaultLoginError}
            handleSubmitForm={(validateCode) => setContactMethodAsDefault(currentUserPersonalDetails, contactMethod, formatPhoneNumber, backTo, true, validateCode)}
            clearError={() => {
                clearContactMethodErrors(contactMethod, 'defaultLogin');
            }}
            onClose={() => {
                Navigation.goBack(ROUTES.SETTINGS_CONTACT_METHOD_DETAILS.getRoute(contactMethod, backTo));
            }}
        />
    );
}

SetDefaultContactMethodConfirmMagicCodePage.displayName = 'SetDefaultContactMethodConfirmMagicCodePage';

export default SetDefaultContactMethodConfirmMagicCodePage;
