import React from 'react';
import type {ImageSourcePropType} from 'react-native';
import {View} from 'react-native';
import type {SvgProps} from 'react-native-svg';
import BlockingView from '@components/BlockingViews/BlockingView';
import Button from '@components/Button';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';

type FailureScreenBaseProps = {
    headerTitle: string;
    icon: React.FC<SvgProps> | ImageSourcePropType;
    iconWidth: number;
    iconHeight: number;
    title: string;
    subtitle: string;
    customSubtitle?: React.ReactElement;
};

function FailureScreenBase({headerTitle, icon, iconWidth, iconHeight, title, subtitle, customSubtitle}: FailureScreenBaseProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const onClose = () => {
        Navigation.closeRHPFlow();
    };

    return (
        <ScreenWrapper testID={FailureScreenBase.displayName}>
            <HeaderWithBackButton
                title={headerTitle}
                onBackButtonPress={onClose}
                shouldShowBackButton
            />
            <View style={styles.flex1}>
                <BlockingView
                    icon={icon}
                    contentFitImage="fill"
                    iconWidth={iconWidth}
                    iconHeight={iconHeight}
                    title={title}
                    titleStyles={styles.mb2}
                    subtitle={subtitle}
                    CustomSubtitle={customSubtitle}
                    subtitleStyle={styles.textSupporting}
                    containerStyle={styles.ph5}
                    testID={FailureScreenBase.displayName}
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

FailureScreenBase.displayName = 'FailureScreenBase';

export default FailureScreenBase;
