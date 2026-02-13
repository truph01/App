import React from 'react';
import {View} from 'react-native';
import BlockingView from '@components/BlockingViews/BlockingView';
import Button from '@components/Button';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import {loadIllustration} from '@components/Icon/IllustrationLoader';
import type {IllustrationName} from '@components/Icon/IllustrationLoader';
import ScreenWrapper from '@components/ScreenWrapper';
import {useMemoizedLazyAsset} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
// Spacing is needed for icon padding configuration
// eslint-disable-next-line no-restricted-imports
import spacing from '@styles/utils/spacing';
import type {TranslationPaths} from '@src/languages/types';

type SuccessScreenBaseProps = {
    headerTitle: TranslationPaths;
    illustration: IllustrationName;
    iconWidth: number;
    iconHeight: number;
    title: TranslationPaths;
    subtitle: TranslationPaths;
};

function SuccessScreenBase({headerTitle, illustration, iconWidth, iconHeight, title, subtitle}: SuccessScreenBaseProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const {asset: icon} = useMemoizedLazyAsset(() => loadIllustration(illustration));

    const onClose = () => {
        Navigation.closeRHPFlow();
    };

    return (
        <ScreenWrapper testID={SuccessScreenBase.displayName}>
            <HeaderWithBackButton
                title={translate(headerTitle)}
                onBackButtonPress={onClose}
                shouldShowBackButton
            />
            <View style={styles.flex1}>
                <BlockingView
                    icon={icon}
                    contentFitImage="fill"
                    iconWidth={iconWidth}
                    iconHeight={iconHeight}
                    title={translate(title)}
                    titleStyles={styles.mb2}
                    subtitle={translate(subtitle)}
                    subtitleStyle={styles.textSupporting}
                    containerStyle={[styles.ph5, spacing.p2]}
                    testID={SuccessScreenBase.displayName}
                />
            </View>
            <View style={[styles.flexRow, styles.m5, styles.mt0]}>
                <Button
                    large
                    success
                    style={styles.flex1}
                    onPress={onClose}
                    text={translate('common.buttonConfirm')}
                />
            </View>
        </ScreenWrapper>
    );
}

SuccessScreenBase.displayName = 'SuccessScreenBase';

export default SuccessScreenBase;
export type {SuccessScreenBaseProps};
