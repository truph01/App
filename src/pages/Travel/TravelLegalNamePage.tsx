import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {clearDraftValues} from '@libs/actions/FormActions';
import Navigation from '@libs/Navigation/Navigation';
import {getFieldRequiredErrors, isRequiredFulfilled, isValidLegalName} from '@libs/ValidationUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import INPUT_IDS from '@src/types/form/PersonalDetailsForm';
import {updateLegalName} from '@libs/actions/PersonalDetails';
import {formatPhoneNumber} from '@libs/LocalePhoneNumber';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';

const STEP_FIELDS = [INPUT_IDS.LEGAL_FIRST_NAME, INPUT_IDS.LEGAL_LAST_NAME];

function TravelLegalNamePage() {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const [privatePersonalDetails] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS, {canBeMissing: true});
    const [draftValues] = useOnyx(ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM_DRAFT, {canBeMissing: true});

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
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
            testID="TravelLegalNamePage"
        >
            <HeaderWithBackButton
                title={translate('travel.bookTravel')}
                onBackButtonPress={handleBackButtonPress}
            />
            <FormProvider
                formID={ONYXKEYS.FORMS.PERSONAL_DETAILS_FORM}
                submitButtonText={translate('common.next')}
                validate={validate}
                onSubmit={handleSubmit}
                style={[styles.mt3, styles.mh5, styles.flexGrow1]}
                enabledWhenOffline
            >
                <View>
                    <Text style={[styles.textHeadlineLineHeightXXL, styles.mb3]}>{translate('privatePersonalDetails.enterLegalName')}</Text>
                    <Text style={[styles.textSupporting, styles.mb6]}>{translate('workspace.moreFeatures.travel.personalDetailsDescription')}</Text>
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.LEGAL_FIRST_NAME}
                        label={translate('personalInfoStep.legalFirstName')}
                        aria-label={translate('personalInfoStep.legalFirstName')}
                        role={CONST.ROLE.PRESENTATION}
                        defaultValue={draftValues?.[INPUT_IDS.LEGAL_FIRST_NAME] ?? privatePersonalDetails?.[INPUT_IDS.LEGAL_FIRST_NAME] ?? ''}
                        shouldSaveDraft
                        containerStyles={[styles.mb6]}
                    />
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.LEGAL_LAST_NAME}
                        label={translate('personalInfoStep.legalLastName')}
                        aria-label={translate('personalInfoStep.legalLastName')}
                        role={CONST.ROLE.PRESENTATION}
                        defaultValue={draftValues?.[INPUT_IDS.LEGAL_LAST_NAME] ?? privatePersonalDetails?.[INPUT_IDS.LEGAL_LAST_NAME] ?? ''}
                        shouldSaveDraft
                        containerStyles={[styles.mb6]}
                    />
                </View>
            </FormProvider>
        </ScreenWrapper>
    );
}

export default TravelLegalNamePage;
