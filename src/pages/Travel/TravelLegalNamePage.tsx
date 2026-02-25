import React, {useEffect} from 'react';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import Text from '@components/Text';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {clearDraftValues} from '@libs/actions/FormActions';
import {updateLegalName} from '@libs/actions/PersonalDetails';
import {formatPhoneNumber} from '@libs/LocalePhoneNumber';
import Navigation from '@libs/Navigation/Navigation';
import {getFieldRequiredErrors, isRequiredFulfilled, isValidLegalName} from '@libs/ValidationUtils';
import {BaseLegalNamePage} from '@pages/settings/Profile/PersonalDetails/LegalNamePage';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import INPUT_IDS from '@src/types/form/PersonalDetailsForm';

const STEP_FIELDS = [INPUT_IDS.LEGAL_FIRST_NAME, INPUT_IDS.LEGAL_LAST_NAME];

function TravelLegalNamePage() {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const [privatePersonalDetails] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS);
    const [draftValues] = useOnyx(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM_DRAFT);

    useEffect(() => () => clearDraftValues(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM), []);

    const validate = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM>): FormInputErrors<typeof ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM> => {
        const errors = getFieldRequiredErrors(values, STEP_FIELDS, translate);

        const firstName = values[INPUT_IDS.LEGAL_FIRST_NAME];
        if (!isRequiredFulfilled(firstName)) {
            errors[INPUT_IDS.LEGAL_FIRST_NAME] = translate('common.error.fieldRequired');
        } else if (!isValidLegalName(firstName)) {
            errors[INPUT_IDS.LEGAL_FIRST_NAME] = translate('privatePersonalDetails.error.hasInvalidCharacter');
        } else if (firstName.length > CONST.LEGAL_NAME.MAX_LENGTH) {
            errors[INPUT_IDS.LEGAL_FIRST_NAME] = translate('common.error.characterLimitExceedCounter', firstName.length, CONST.LEGAL_NAME.MAX_LENGTH);
        }

        const lastName = values[INPUT_IDS.LEGAL_LAST_NAME];
        if (!isRequiredFulfilled(lastName)) {
            errors[INPUT_IDS.LEGAL_LAST_NAME] = translate('common.error.fieldRequired');
        } else if (!isValidLegalName(lastName)) {
            errors[INPUT_IDS.LEGAL_LAST_NAME] = translate('privatePersonalDetails.error.hasInvalidCharacter');
        } else if (lastName.length > CONST.LEGAL_NAME.MAX_LENGTH) {
            errors[INPUT_IDS.LEGAL_LAST_NAME] = translate('common.error.characterLimitExceedCounter', lastName.length, CONST.LEGAL_NAME.MAX_LENGTH);
        }

        return errors;
    };

    const handleSubmit = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM>) => {
        updateLegalName(values.legalFirstName?.trim() ?? '', values.legalLastName?.trim() ?? '', formatPhoneNumber, currentUserPersonalDetails);
    };

    const handleBackButtonPress = () => {
        clearDraftValues(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM);
        Navigation.closeRHPFlow();
    };

    return (
        <BaseLegalNamePage
            formID={ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM}
            submitButtonText={translate('common.next')}
            onBackButtonPress={handleBackButtonPress}
            onSubmit={handleSubmit}
            validate={validate}
            headerTitle={translate('travel.bookTravel')}
            shouldSaveDraft
            defaultFirstName={draftValues?.[INPUT_IDS.LEGAL_FIRST_NAME] ?? privatePersonalDetails?.[INPUT_IDS.LEGAL_FIRST_NAME]}
            defaultLastName={draftValues?.[INPUT_IDS.LEGAL_LAST_NAME] ?? privatePersonalDetails?.[INPUT_IDS.LEGAL_LAST_NAME]}
        >
            <Text style={[styles.textHeadlineLineHeightXXL, styles.mb3]}>{translate('privatePersonalDetails.enterLegalName')}</Text>
            <Text style={[styles.textSupporting, styles.mb6]}>{translate('workspace.moreFeatures.travel.personalDetailsDescription')}</Text>
        </BaseLegalNamePage>
    );
}

export default TravelLegalNamePage;
