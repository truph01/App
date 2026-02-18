import React, {useCallback, useEffect, useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import ValidateCodeActionContent from '@components/ValidateCodeActionModal/ValidateCodeActionContent';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import {clearDraftValues} from '@libs/actions/FormActions';
import {clearPersonalDetailsErrors, setPrivatePersonalDetails} from '@libs/actions/PersonalDetails';
import {requestValidateCodeAction, resetValidateActionCodeSent} from '@libs/actions/User';
import {normalizeCountryCode} from '@libs/CountryUtils';
import {getLatestError} from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {TravelMissingPersonalDetailsParamList} from '@libs/Navigation/types';
import {areTravelPersonalDetailsMissing} from '@libs/PersonalDetailsUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import {primaryLoginSelector} from '@src/selectors/Account';
import type {PersonalDetailsForm} from '@src/types/form';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import {getSubPageValues} from '@pages/MissingPersonalDetails/utils';

function TravelMissingPersonalDetailsConfirmMagicCodePage() {
    const {translate} = useLocalize();
    const route = useRoute<RouteProp<TravelMissingPersonalDetailsParamList, typeof SCREENS.WORKSPACE.TRAVEL_MISSING_PERSONAL_DETAILS_CONFIRM_MAGIC_CODE>>();
    const policyID = route.params.policyID;
    const [privatePersonalDetails] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS, {canBeMissing: false});
    const [draftValues] = useOnyx(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM_DRAFT, {canBeMissing: false});
    const [primaryLogin] = useOnyx(ONYXKEYS.ACCOUNT, {selector: primaryLoginSelector, canBeMissing: true});
    const [validateCodeAction] = useOnyx(ONYXKEYS.VALIDATE_ACTION_CODE, {canBeMissing: true});

    const privateDetailsErrors = privatePersonalDetails?.errors ?? undefined;
    const validateLoginError = getLatestError(privateDetailsErrors);

    const missingDetails = areTravelPersonalDetailsMissing(privatePersonalDetails);

    useEffect(() => {
        resetValidateActionCodeSent();
    }, []);

    useEffect(() => {
        if (missingDetails || !!privateDetailsErrors) {
            return;
        }

        clearDraftValues(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM);
        Navigation.dismissModal();
    }, [missingDetails, privateDetailsErrors]);

    const clearError = () => {
        if (isEmptyObject(validateLoginError) && isEmptyObject(validateCodeAction?.errorFields)) {
            return;
        }
        clearPersonalDetailsErrors();
    };

    const values = useMemo(() => normalizeCountryCode(getSubPageValues(privatePersonalDetails, draftValues)) as PersonalDetailsForm, [privatePersonalDetails, draftValues]);

    const handleSubmitForm = useCallback(
        (validateCode: string) => {
            setPrivatePersonalDetails(values, validateCode);
        },
        [values],
    );

    return (
        <ValidateCodeActionContent
            title={translate('cardPage.validateCardTitle')}
            descriptionPrimary={translate('contacts.enterMagicCode', primaryLogin ?? '')}
            sendValidateCode={() => requestValidateCodeAction()}
            validateCodeActionErrorField="personalDetails"
            handleSubmitForm={handleSubmitForm}
            validateError={validateLoginError}
            clearError={clearError}
            onClose={() => {
                resetValidateActionCodeSent();
                Navigation.goBack(ROUTES.WORKSPACE_TRAVEL_MISSING_PERSONAL_DETAILS.getRoute(policyID));
            }}
            isLoading={privatePersonalDetails?.isLoading}
        />
    );
}

export default TravelMissingPersonalDetailsConfirmMagicCodePage;
