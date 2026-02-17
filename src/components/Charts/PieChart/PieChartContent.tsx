import React, {useState} from 'react';
import type {LayoutChangeEvent} from 'react-native';
import {View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {useSharedValue} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {Pie, PolarChart} from 'victory-native';
import ActivityIndicator from '@components/ActivityIndicator';
import ChartHeader from '@components/Charts/components/ChartHeader';
import ChartTooltip from '@components/Charts/components/ChartTooltip';
import {TOOLTIP_BAR_GAP, useChartLabelFormats, useTooltipData} from '@components/Charts/hooks';
import type {ChartDataPoint, PieChartProps, PieSlice} from '@components/Charts/types';
import {getChartColor} from '@components/Charts/utils';
import Text from '@components/Text';
import useThemeStyles from '@hooks/useThemeStyles';

/** Starting angle for pie chart (0 = 3 o'clock, -90 = 12 o'clock) */
const PIE_CHART_START_ANGLE = -90;

/**
 * Process raw data into slices.
 */
function processDataIntoSlices(data: ChartDataPoint[], startAngle: number): PieSlice[] {
    if (data.length === 0) {
        return [];
    }

    // Use absolute values so refunds/negative amounts are represented by slice size
    const absoluteData = data.map((point, index) => ({
        ...point,
        absTotal: Math.abs(point.total),
        originalIndex: index,
    }));

    const total = absoluteData.reduce((sum, point) => sum + point.absTotal, 0);
    if (total === 0) {
        return [];
    }

    // Sort by absolute value descending
    absoluteData.sort((a, b) => b.absTotal - a.absTotal);

    // Build final slices array
    let currentAngle = startAngle;
    return absoluteData.map((slice, index) => {
        const sweepAngle = (slice.absTotal / total) * 360;
        const pieSlice: PieSlice = {
            label: slice.label,
            value: slice.absTotal,
            color: getChartColor(index),
            percentage: (slice.absTotal / total) * 100,
            startAngle: currentAngle,
            endAngle: currentAngle + sweepAngle,
            originalIndex: slice.originalIndex,
        };
        currentAngle += sweepAngle;
        return pieSlice;
    });
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
    'worklet';

    let normalized = angle % 360;
    if (normalized < 0) {
        normalized += 360;
    }
    return normalized;
}

/**
 * Check if an angle is within a slice's range (handles wrap-around)
 */
function isAngleInSlice(angle: number, startAngle: number, endAngle: number): boolean {
    'worklet';

    const normalizedAngle = normalizeAngle(angle);
    const normalizedStart = normalizeAngle(startAngle);
    const normalizedEnd = normalizeAngle(endAngle);

    // Handle wrap-around case (slice crosses 0°)
    if (normalizedStart > normalizedEnd) {
        return normalizedAngle >= normalizedStart || normalizedAngle < normalizedEnd;
    }
    return normalizedAngle >= normalizedStart && normalizedAngle < normalizedEnd;
}

/**
 * Find which slice index contains the given cursor position
 */
function findSliceAtPosition(cursorX: number, cursorY: number, centerX: number, centerY: number, radius: number, innerRadius: number, slices: PieSlice[]): number {
    'worklet';

    // Convert cursor to polar coordinates relative to center
    const dx = cursorX - centerX;
    const dy = cursorY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if within pie ring
    if (distance < innerRadius || distance > radius) {
        return -1;
    }

    // Calculate angle in degrees (atan2 returns radians, 0 at 3 o'clock, positive clockwise)
    const cursorAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Find which slice contains this angle
    return slices.findIndex((slice) => isAngleInSlice(cursorAngle, slice.startAngle, slice.endAngle));
}

function PieChartContent({data, title, titleIcon, isLoading, valueUnit, onSlicePress}: PieChartProps) {
    const styles = useThemeStyles();
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);
    const [activeSliceIndex, setActiveSliceIndex] = useState(-1);

    // Shared values for hover state
    const isHovering = useSharedValue(false);
    const cursorX = useSharedValue(0);
    const cursorY = useSharedValue(0);
    const tooltipPosition = useSharedValue({x: 0, y: 0});

    const handleLayout = (event: LayoutChangeEvent) => {
        setCanvasWidth(event.nativeEvent.layout.width);
        setCanvasHeight(event.nativeEvent.layout.height);
    };

    // Process data into slices with aggregation.
    const processedSlices: PieSlice[] = processDataIntoSlices(data, PIE_CHART_START_ANGLE);

    // Map sorted slice index back to original data index for the tooltip hook
    const activeOriginalDataIndex = activeSliceIndex >= 0 ? (processedSlices.at(activeSliceIndex)?.originalIndex ?? -1) : -1;

    const {formatValue} = useChartLabelFormats({data, unit: valueUnit});
    const tooltipData = useTooltipData(activeOriginalDataIndex, data, formatValue);

    // Calculate pie geometry
    const pieGeometry = {radius: Math.min(canvasWidth, canvasHeight) / 2, centerX: canvasWidth / 2, centerY: canvasHeight / 2};

    // Handle hover state updates
    const updateActiveSlice = (x: number, y: number) => {
        const {radius, centerX, centerY} = pieGeometry;
        const sliceIndex = findSliceAtPosition(x, y, centerX, centerY, radius, 0, processedSlices);
        setActiveSliceIndex(sliceIndex);
    };

    // Handle slice press callback
    const handleSlicePress = (sliceIndex: number) => {
        if (sliceIndex < 0 || sliceIndex >= processedSlices.length) {
            return;
        }
        const slice = processedSlices.at(sliceIndex);
        if (!slice) {
            return;
        }
        const originalDataPoint = data.at(slice.originalIndex);
        if (originalDataPoint && onSlicePress) {
            onSlicePress(originalDataPoint, slice.originalIndex);
        }
    };

    // Hover gesture
    const hoverGesture = () =>
        Gesture.Hover()
            .onBegin((e) => {
                'worklet';

                isHovering.set(true);
                cursorX.set(e.x);
                cursorY.set(e.y);
                tooltipPosition.set({x: e.x, y: e.y - TOOLTIP_BAR_GAP});
                scheduleOnRN(updateActiveSlice, e.x, e.y);
            })
            .onUpdate((e) => {
                'worklet';

                cursorX.set(e.x);
                cursorY.set(e.y);
                tooltipPosition.set({x: e.x, y: e.y - TOOLTIP_BAR_GAP});
                scheduleOnRN(updateActiveSlice, e.x, e.y);
            })
            .onEnd(() => {
                'worklet';

                isHovering.set(false);
                scheduleOnRN(setActiveSliceIndex, -1);
            });

    // Tap gesture for click/tap navigation
    const tapGesture = () =>
        Gesture.Tap().onEnd((e) => {
            'worklet';

            const {radius, centerX, centerY} = pieGeometry;
            const sliceIndex = findSliceAtPosition(e.x, e.y, centerX, centerY, radius, 0, processedSlices);

            if (sliceIndex >= 0) {
                scheduleOnRN(handleSlicePress, sliceIndex);
            }
        });

    // Combined gestures - Race allows both hover and tap to work independently
    const combinedGesture = Gesture.Race(hoverGesture(), tapGesture());

    const renderLegendItem = (slice: PieSlice) => {
        return (
            <View
                key={`legend-${slice.label}`}
                style={[styles.flexRow, styles.alignItemsCenter, styles.mr4, styles.mb2]}
            >
                <View style={[styles.pieChartLegendDot, {backgroundColor: slice.color}]} />
                <Text style={[styles.textNormal, styles.ml2]}>{slice.label}</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.pieChartContainer, styles.highlightBG, styles.justifyContentCenter, styles.alignItemsCenter]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (data.length === 0) {
        return null;
    }

    return (
        <View style={[styles.pieChartContainer, styles.highlightBG]}>
            <ChartHeader
                title={title}
                titleIcon={titleIcon}
            />

            <GestureDetector gesture={combinedGesture}>
                <Animated.View
                    style={styles.pieChartChartContainer}
                    onLayout={handleLayout}
                >
                    {processedSlices.length > 0 && (
                        <PolarChart
                            data={processedSlices}
                            labelKey="label"
                            valueKey="value"
                            colorKey="color"
                        >
                            <Pie.Chart startAngle={PIE_CHART_START_ANGLE} />
                        </PolarChart>
                    )}

                    {/* Tooltip */}
                    {activeSliceIndex >= 0 && !!tooltipData && (
                        <ChartTooltip
                            label={tooltipData.label}
                            amount={tooltipData.amount}
                            percentage={tooltipData.percentage}
                            chartWidth={canvasWidth}
                            initialTooltipPosition={tooltipPosition}
                        />
                    )}
                </Animated.View>
            </GestureDetector>
            <View style={styles.pieChartLegendContainer}>{processedSlices.map((slice) => renderLegendItem(slice))}</View>
        </View>
    );
}

export default PieChartContent;
