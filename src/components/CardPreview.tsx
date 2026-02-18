import type {StyleProp, ViewStyle} from 'react-native';
import React from 'react';
import {View} from 'react-native';
import {useMemoizedLazyIllustrations} from '@hooks/useLazyAsset';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import variables from '@styles/variables';
import ONYXKEYS from '@src/ONYXKEYS';
import type IconAsset from '@src/types/utils/IconAsset';
import ImageSVG from './ImageSVG';
import Text from './Text';

type CardPreviewProps = {
    /** Optional overlay image rendered on top of the card. */
    overlayImage?: IconAsset;

    /** Styles for overlay container (absolute positioning, size, etc.). */
    overlayContainerStyle?: StyleProp<ViewStyle>;

    /** Optional override for the displayed cardholder name. */
    cardHolderName?: string;
};

function CardPreview({overlayImage, overlayContainerStyle, cardHolderName}: CardPreviewProps) {
    const styles = useThemeStyles();
    const lazyIllustrations = useMemoizedLazyIllustrations(['ExpensifyCardImage']);

    const [privatePersonalDetails] = useOnyx(ONYXKEYS.PRIVATE_PERSONAL_DETAILS, {canBeMissing: true});
    const [session] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: true});

    const {legalFirstName, legalLastName} = privatePersonalDetails ?? {};
    const cardHolder = cardHolderName ?? (legalFirstName && legalLastName ? `${legalFirstName} ${legalLastName}` : (session?.email ?? ''));

    return (
        <View
            style={[
                styles.pRelative,
                styles.alignSelfCenter,
                {
                    width: variables.cardPreviewWidth,
                },
            ]}
        >
            <View style={styles.walletCard}>
                <ImageSVG
                    contentFit="contain"
                    src={lazyIllustrations.ExpensifyCardImage}
                    pointerEvents="none"
                    height={variables.cardPreviewHeight}
                    width={variables.cardPreviewWidth}
                />
                <Text
                    style={styles.walletCardHolder}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {cardHolder}
                </Text>
            </View>
            {!!overlayImage && (
                <View
                    pointerEvents="none"
                    style={[styles.pAbsolute, overlayContainerStyle]}
                >
                    <ImageSVG
                        src={overlayImage}
                        contentFit="contain"
                        width="100%"
                        height="100%"
                    />
                </View>
            )}
        </View>
    );
}

export default CardPreview;
