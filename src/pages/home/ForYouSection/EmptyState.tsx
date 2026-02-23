import React from 'react';
import {View} from 'react-native';
import type {IllustrationName} from '@components/Icon/chunks/illustrations.chunk';
import ImageSVG from '@components/ImageSVG';
import Text from '@components/Text';
import {useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import type {TranslationPaths} from '@src/languages/types';

const ILLUSTRATION_SIZE = 100;

const MSG = 'homePage.forYouSection.emptyStateMessages' as const;

// ── Edit this table to update copy ──────────────────────────────────
// [Illustration,        subtitle,              description       ]
const ENTRY_DATA: Array<[IllustrationName, string, string]> = [
    ['ThumbsUpStars', 'thumbsUpStar', 'keepAnEyeOut'],
    ['SmallRocket', 'launchSomethingNew', 'upcomingTodos'],
    ['CowboyHat', 'wrangledEveryTask', 'keepAnEyeOut'],
    ['Trophy1', 'thankTheAcademy', 'upcomingTodos'],
    ['PalmTree', 'hitTheBeach', 'keepAnEyeOut'],
    ['FishbowlBlue', 'cuteFish', 'upcomingTodos'],
    ['Target', 'rightOnTarget', 'keepAnEyeOut'],
    ['Chair', 'takeASeat', 'upcomingTodos'],
    ['Broom', 'niceAndTidy', 'keepAnEyeOut'],
    ['House', 'welcomeHome', 'upcomingTodos'],
    ['ConciergeBot', 'beepBoop', 'keepAnEyeOut'],
    ['CheckboxText', 'checkedEveryBox', 'upcomingTodos'],
    ['Trophy', 'shinyTrophy', 'keepAnEyeOut'],
    ['Flash', 'fastAsLightning', 'upcomingTodos'],
    ['Sunglasses', 'tooCool', 'keepAnEyeOut'],
    ['F1Flags', 'crossedFinishLine', 'upcomingTodos'],
];
// ────────────────────────────────────────────────────────────────────

type EmptyStateConfig = {
    subtitleKey: TranslationPaths;
    descriptionKey: TranslationPaths;
    illustrationName: IllustrationName;
};

const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = ENTRY_DATA.map(([illustrationName, subtitle, description]) => ({
    subtitleKey: `${MSG}.${subtitle}` as TranslationPaths,
    descriptionKey: `${MSG}.${description}` as TranslationPaths,
    illustrationName,
}));

const ILLUSTRATION_NAMES = EMPTY_STATE_CONFIGS.map((c) => c.illustrationName);

function EmptyState() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const illustrations = useMemoizedLazyIllustrations(ILLUSTRATION_NAMES);

    // Select a random empty state message on mount (will change on refresh/remount)
    // eslint-disable-next-line react-hooks/purity -- Random selection is intentional and should only happen once on mount
    const randomIndex = Math.floor(Math.random() * EMPTY_STATE_CONFIGS.length);
    // eslint-disable-next-line rulesdir/prefer-at -- Using [0] for definite type since .at() returns T | undefined
    const config = EMPTY_STATE_CONFIGS.at(randomIndex) ?? EMPTY_STATE_CONFIGS[0];

    return (
        <View style={styles.forYouEmptyStateContainer}>
            <ImageSVG
                src={illustrations[config.illustrationName]}
                width={ILLUSTRATION_SIZE}
                height={ILLUSTRATION_SIZE}
            />
            <View style={styles.forYouEmptyStateTextContainer}>
                <Text style={shouldUseNarrowLayout ? styles.forYouEmptyStateNarrowTitle : styles.forYouEmptyStateWideTitle}>{translate(config.subtitleKey)}</Text>
                <Text style={shouldUseNarrowLayout ? styles.forYouEmptyStateNarrowDescription : styles.forYouEmptyStateWideDescription}>{translate(config.descriptionKey)}</Text>
            </View>
        </View>
    );
}

export default EmptyState;
