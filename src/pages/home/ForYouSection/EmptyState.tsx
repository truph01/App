import React from 'react';
import {View} from 'react-native';
import type {IllustrationName} from '@components/Icon/chunks/illustrations.chunk';
import ImageSVG from '@components/ImageSVG';
import Text from '@components/Text';
import {useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {TranslationPaths} from '@src/languages/types';

const ILLUSTRATION_SIZE = 68;

const MSG = 'homePage.forYouSection.emptyStateMessages' as const;

// ── Edit this table to update copy ──────────────────────────────────
// [Illustration,      title,                description              ]
const ENTRY_DATA: Array<[IllustrationName, string, string]> = [
    ['ThumbsUpStars', 'youreDone', 'thumbsUpKeepEyeOut'],
    ['SmallRocket', 'allCaughtUpTitle', 'todosWillLaunch'],
    ['CowboyHat', 'youreDone', 'tasksWrangledKeepEyeOut'],
    ['Trophy1', 'nothingToShow', 'youDidItKeepEyeOut'],
    ['PalmTree', 'allCaughtUpTitle', 'relaxKeepEyeOut'],
    ['FishbowlBlue', 'youreDone', 'floatTodosHere'],
    ['Target', 'allCaughtUpTitle', 'stayOnTargetKeepEyeOut'],
    ['Chair', 'nothingToShow', 'relaxTodosHere'],
    ['Broom', 'youreDone', 'tasksCleanKeepEyeOut'],
    ['House', 'allCaughtUpTitle', 'todosAppearHome'],
    ['ConciergeBot', 'nothingToShow', 'beepBoopKeepEyeOut'],
    ['CheckboxText', 'allCaughtUpTitle', 'checkOffTodosHere'],
    ['Flash', 'youreDone', 'zapTodosHere'],
    ['Sunglasses', 'nothingToShow', 'chillKeepEyeOut'],
    ['F1Flags', 'allCaughtUpTitle', 'finishedKeepEyeOut'],
];
// ────────────────────────────────────────────────────────────────────

type EmptyStateConfig = {
    titleKey: TranslationPaths;
    descriptionKey: TranslationPaths;
    illustrationName: IllustrationName;
};

const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = ENTRY_DATA.map(([illustrationName, title, description]) => ({
    titleKey: `${MSG}.${title}` as TranslationPaths,
    descriptionKey: `${MSG}.${description}` as TranslationPaths,
    illustrationName,
}));

const ILLUSTRATION_NAMES = EMPTY_STATE_CONFIGS.map((c) => c.illustrationName);

// Selected once at module load so the message stays stable across remounts (e.g. during onboarding modals)
const RANDOM_INDEX = Math.floor(Math.random() * EMPTY_STATE_CONFIGS.length);
// eslint-disable-next-line rulesdir/prefer-at -- Using [0] for definite type since .at() returns T | undefined
const CONFIG = EMPTY_STATE_CONFIGS.at(RANDOM_INDEX) ?? EMPTY_STATE_CONFIGS[0];

function EmptyState() {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const illustrations = useMemoizedLazyIllustrations(ILLUSTRATION_NAMES);

    return (
        <View style={styles.forYouEmptyStateContainer}>
            <ImageSVG
                src={illustrations[CONFIG.illustrationName]}
                width={ILLUSTRATION_SIZE}
                height={ILLUSTRATION_SIZE}
            />
            <View style={styles.forYouEmptyStateTextContainer}>
                <Text style={styles.forYouEmptyStateTitle}>{translate(CONFIG.titleKey)}</Text>
                <Text style={styles.forYouEmptyStateDescription}>{translate(CONFIG.descriptionKey)}</Text>
            </View>
        </View>
    );
}

export default EmptyState;
