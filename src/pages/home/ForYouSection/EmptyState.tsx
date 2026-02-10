import React from 'react';
import {View} from 'react-native';
import type {IllustrationName} from '@components/Icon/chunks/illustrations.chunk';
import ImageSVG from '@components/ImageSVG';
import Text from '@components/Text';
import {useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {TranslationPaths} from '@src/languages/types';

const ILLUSTRATION_WIDTH = 100;
const ILLUSTRATION_DEFAULT_HEIGHT = 100;

type EmptyStateConfig = {
    titleKey: TranslationPaths;
    subtitleKey: TranslationPaths;
    illustrationName: IllustrationName;
    illustrationHeight: number;
};

const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = [
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpTitle',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.keepAnEyeOut',
        illustrationName: 'ThumbsUpStars',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.niceWork',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.keepAnEyeOut',
        illustrationName: 'SmallRocket',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.yeehaw',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpSubtitle',
        illustrationName: 'CowboyHat',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.youWin',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpSubtitle',
        illustrationName: 'Trophy1',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpExclaim',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.timeForABreak',
        illustrationName: 'PalmTree',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpExclaim',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.timeForABreak',
        illustrationName: 'FishbowlBlue',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.bullseye',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpSubtitle',
        illustrationName: 'Target',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allDone',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.timeToRelax',
        illustrationName: 'Chair',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allClean',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.timeToRelax',
        illustrationName: 'Broom',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.takeItEasy',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.everythingsTidiedUp',
        illustrationName: 'House',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.nothingToShow',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.caughtUpOnTasks',
        illustrationName: 'ConciergeBot',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.tasksCompleted',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpSubtitle',
        illustrationName: 'CheckboxText',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.youreNumber1',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.caughtUpOnTasks',
        illustrationName: 'Trophy',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.kaZap',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.caughtUpOnTasks',
        illustrationName: 'Flash',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allDone',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.caughtUpOnTasks',
        illustrationName: 'F1Flags',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.finished',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.caughtUpOnTasks',
        illustrationName: 'Sunglasses',
        illustrationHeight: ILLUSTRATION_DEFAULT_HEIGHT,
    },
    {
        titleKey: 'homePage.forYouSection.emptyStateMessages.allCaughtUpSubtitle',
        subtitleKey: 'homePage.forYouSection.emptyStateMessages.upcomingTodos',
        illustrationName: 'Fireworks',
        // Fireworks viewBox is 164x148, so height = 100 * (148/164) ≈ 90
        illustrationHeight: 90,
    },
];

const ILLUSTRATION_NAMES = EMPTY_STATE_CONFIGS.map((c) => c.illustrationName);

function EmptyState() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
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
                width={ILLUSTRATION_WIDTH}
                height={config.illustrationHeight}
            />
            <Text style={styles.forYouEmptyStateTitle}>{translate(config.titleKey)}</Text>
            <Text style={styles.forYouEmptyStateSubtitle}>{translate(config.subtitleKey)}</Text>
        </View>
    );
}

export default EmptyState;
