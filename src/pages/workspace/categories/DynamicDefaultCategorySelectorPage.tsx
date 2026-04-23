import React from 'react';
import CategoryPicker from '@components/CategoryPicker';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import type {ListItem} from '@components/SelectionList/types';
import useDynamicBackPath from '@hooks/useDynamicBackPath';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import {setPolicyCustomUnitDefaultCategory} from '@userActions/Policy/Category';
import ONYXKEYS from '@src/ONYXKEYS';
import {DYNAMIC_ROUTES} from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

type DynamicDefaultCategorySelectorPageProps = PlatformStackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.DYNAMIC_DEFAULT_CATEGORY_SELECTOR>;

function DynamicDefaultCategorySelectorPage({route}: DynamicDefaultCategorySelectorPageProps) {
    const {policyID, customUnitID} = route.params;
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [policy] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${policyID}`);
    const currentCategory = policy?.customUnits?.[customUnitID]?.defaultCategory ?? '';
    const backPath = useDynamicBackPath(DYNAMIC_ROUTES.DEFAULT_CATEGORY_SELECTOR.path);

    const onCategorySelected = (selectedCategory: ListItem) => {
        if (!selectedCategory.searchText || currentCategory === selectedCategory.searchText) {
            return;
        }
        setPolicyCustomUnitDefaultCategory(policyID, customUnitID, currentCategory, selectedCategory.searchText);
        Navigation.goBack(backPath);
    };

    return (
        <ScreenWrapper
            style={styles.pb0}
            includePaddingTop={false}
            enableEdgeToEdgeBottomSafeAreaPadding
            shouldEnableKeyboardAvoidingView={false}
            testID="DynamicDefaultCategorySelectorPage"
        >
            <HeaderWithBackButton
                title={translate('workspace.common.defaultCategory')}
                shouldShowBackButton
                onBackButtonPress={() => Navigation.goBack(backPath)}
            />
            <CategoryPicker
                policyID={policyID}
                selectedCategory={currentCategory}
                onSubmit={onCategorySelected}
                addBottomSafeAreaPadding
            />
        </ScreenWrapper>
    );
}

export default DynamicDefaultCategorySelectorPage;
