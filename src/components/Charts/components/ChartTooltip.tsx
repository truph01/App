import React, {useCallback, useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {View} from 'react-native';
import Animated, {useAnimatedStyle, useDerivedValue, useSharedValue} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';
import Text from '@components/Text';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';

/** The height of the chart tooltip pointer */
const TOOLTIP_POINTER_HEIGHT = 4;

/** The width of the chart tooltip pointer */
const TOOLTIP_POINTER_WIDTH = 12;

type ChartTooltipProps = {
    /** Label text (e.g., "Airfare", "Amazon") */
    label: string;

    /** Formatted amount (e.g., "$1,820.00") */
    amount: string;

    /** Optional percentage to display (e.g., "12%") */
    percentage?: string;

    /** The width of the chart container */
    chartWidth: number;

    /** The initial tooltip position */
    initialTooltipPosition: SharedValue<{x: number; y: number}>;
};

function ChartTooltip({label, amount, percentage, chartWidth, initialTooltipPosition}: ChartTooltipProps) {
    const theme = useTheme();
    const styles = useThemeStyles();

    /** Shared value to store the measured width of the tooltip container */
    const tooltipMeasuredWidth = useSharedValue(0);

    const content = percentage ? `${label} • ${amount} (${percentage})` : `${label} • ${amount}`;

    /** * Visibility gate: Only true when the tooltip has been measured */
    const [hasMeasured, setHasMeasured] = useState(false);

    /**
     * Updates the shared width value and sets the measured content key.
     * This triggers the opacity flip once the layout engine confirms dimensions.
     */
    const handleTooltipLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const {width} = event.nativeEvent.layout;
            if (width > 0) {
                tooltipMeasuredWidth.set(width);
                setHasMeasured(true);
            }
        },
        [tooltipMeasuredWidth],
    );

    /** Calculate the center point, ensuring the box doesn't overflow the left or right edges */
    const clampedCenter = useDerivedValue(() => {
        const {x} = initialTooltipPosition.get();
        const width = tooltipMeasuredWidth.get();
        const halfWidth = width / 2;

        return Math.max(halfWidth, Math.min(chartWidth - halfWidth, x));
    }, [initialTooltipPosition, tooltipMeasuredWidth, chartWidth]);

    /**
     * Animated style for the main tooltip container.
     * Calculates the clamped center to keep the box within chart boundaries.
     */
    const tooltipStyle = useAnimatedStyle(() => {
        const {y} = initialTooltipPosition.get();

        return {
            position: 'absolute',
            left: clampedCenter.get(),
            top: y,
            /** Center the wrapper horizontally and lift it entirely above the Y point */
            transform: [{translateX: '-50%'}, {translateY: '-100%'}],
            /** Keep invisible until measurement for the current bar's content is ready */
            opacity: hasMeasured ? 1 : 0,
        };
    }, [chartWidth, initialTooltipPosition, hasMeasured]);

    /**
     * Animated style for the pointer (triangle).
     * Calculates the relative offset to keep the pointer pinned to the bar (initialX)
     * even when the main container is clamped to the edges.
     */
    const pointerStyle = useAnimatedStyle(() => {
        const {x} = initialTooltipPosition.get();

        const relativeOffset = x - clampedCenter.get();

        return {
            transform: [{translateX: relativeOffset}],
        };
    }, [chartWidth, initialTooltipPosition]);

    return (
        <Animated.View
            style={tooltipStyle}
            onLayout={handleTooltipLayout}
            pointerEvents="none"
        >
            <View style={styles.chartTooltipWrapper}>
                <View style={styles.chartTooltipBox}>
                    <Text
                        style={styles.chartTooltipText}
                        numberOfLines={1}
                    >
                        {content}
                    </Text>
                </View>
                <Animated.View
                    style={[
                        styles.chartTooltipPointer,
                        {
                            borderLeftWidth: TOOLTIP_POINTER_WIDTH / 2,
                            borderRightWidth: TOOLTIP_POINTER_WIDTH / 2,
                            borderTopWidth: TOOLTIP_POINTER_HEIGHT,
                            borderLeftColor: theme.transparent,
                            borderRightColor: theme.transparent,
                            borderTopColor: theme.heading,
                        },
                        pointerStyle,
                    ]}
                />
            </View>
        </Animated.View>
    );
}

ChartTooltip.displayName = 'ChartTooltip';

export default ChartTooltip;
