import React from 'react';
import {View} from 'react-native';
import BlockingView from '@components/BlockingViews/BlockingView';
import Button from '@components/Button';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import {loadIllustration} from '@components/Icon/IllustrationLoader';
import type {LocaleContextProps} from '@components/LocaleContextProvider';
import {MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG} from '@components/MultifactorAuthentication/config';
import type {MultifactorAuthenticationOutcomeConfig} from '@components/MultifactorAuthentication/config/types';
import {useMultifactorAuthenticationState} from '@components/MultifactorAuthentication/Context';
import ScreenWrapper from '@components/ScreenWrapper';
import {useMemoizedLazyAsset} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import CONST from '@src/CONST';
import type {MultifactorAuthenticationTranslationParams} from '@src/languages/params';
import type {TranslationPaths} from '@src/languages/types';

type MultifactorAuthenticationLocalize = LocaleContextProps & {
    translate: <TPath extends TranslationPaths>(path: TPath, params: MultifactorAuthenticationTranslationParams) => string;
};

function getOutcomeKey(errorReason: string | undefined): string {
    if (!errorReason) {
        return 'success';
    }

    switch (errorReason) {
        case CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.NO_ELIGIBLE_METHODS:
            return 'noEligibleMethods';
        case CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.UNSUPPORTED_DEVICE:
            return 'unsupportedDevice';
        default:
            return 'failure';
    }
}

function MultifactorAuthenticationOutcomePage() {
    const {translate} = useLocalize() as MultifactorAuthenticationLocalize;
    const styles = useThemeStyles();
    const {state} = useMultifactorAuthenticationState();
    const onGoBackPress = () => {
        Navigation.closeRHPFlow();
    };

    const outcomeKey = getOutcomeKey(state.error?.reason);
    const scenarioConfig = state.scenario ? MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG[state.scenario] : undefined;
    const data: MultifactorAuthenticationOutcomeConfig | undefined = scenarioConfig?.OUTCOMES[outcomeKey as keyof typeof scenarioConfig.OUTCOMES];

    const {asset: icon} = useMemoizedLazyAsset(() => loadIllustration(data?.illustration ?? 'HumptyDumpty'));

    const headerTitle = translate(data?.headerTitle ?? 'multifactorAuthentication.biometricsTest.biometricsAuthentication');
    const title = translate(data?.title ?? 'multifactorAuthentication.oops');

    const description = translate(data?.description ?? 'multifactorAuthentication.biometricsTest.yourAttemptWasUnsuccessful', {
        authType: state.authenticationMethod?.name,
        registered: false,
    });

    const CustomDescription = data?.customDescription;
    const CustomSubtitle = CustomDescription ? <CustomDescription /> : undefined;

    return (
        <ScreenWrapper testID={MultifactorAuthenticationOutcomePage.displayName}>
            <HeaderWithBackButton
                title={headerTitle}
                onBackButtonPress={onGoBackPress}
                shouldShowBackButton
            />
            <View style={styles.flex1}>
                <BlockingView
                    icon={icon}
                    contentFitImage="fill"
                    iconWidth={data?.iconWidth}
                    iconHeight={data?.iconHeight}
                    title={title}
                    titleStyles={styles.mb2}
                    subtitle={description}
                    CustomSubtitle={CustomSubtitle}
                    subtitleStyle={styles.textSupporting}
                    containerStyle={styles.ph5}
                    testID={MultifactorAuthenticationOutcomePage.displayName}
                />
            </View>
            <View style={[styles.flexRow, styles.m5, styles.mt0]}>
                <Button
                    large
                    success
                    style={styles.flex1}
                    onPress={onGoBackPress}
                    text={translate('common.buttonConfirm')}
                />
            </View>
        </ScreenWrapper>
    );
}

MultifactorAuthenticationOutcomePage.displayName = 'MultifactorAuthenticationOutcomePage';

export default MultifactorAuthenticationOutcomePage;
