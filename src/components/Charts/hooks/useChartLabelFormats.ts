import type {SkFont} from '@shopify/react-native-skia';
import {useCallback} from 'react';
import type {ChartDataPoint, YAxisUnit, YAxisUnitPosition} from '@components/Charts/types';
import useLocalize from '@hooks/useLocalize';
import {LABEL_ROTATIONS} from './useChartLabelLayout';

type UseChartLabelFormatsProps = {
    data: ChartDataPoint[];
    font: SkFont | null;
    yAxisUnit?: YAxisUnit;
    yAxisUnitPosition?: YAxisUnitPosition;
    labelSkipInterval?: number;
    labelRotation?: number;
    truncatedLabels?: string[];
};

/**
 * Checks if all characters in the text can be rendered by the font.
 * Returns true if all glyphs are supported (no glyph ID is 0).
 *
 * TODO: This is a temporary solution until we properly support rendering all currency symbols in the chart font.
 */
function canFontRenderText(font: SkFont, text: string): boolean {
    const glyphIDs = font.getGlyphIDs(text);
    return glyphIDs.every((id) => id !== 0);
}

/**
 * Resolves the display unit based on font support.
 * If yAxisUnit is a string, returns it directly.
 * If yAxisUnit is an object with value/fallback, checks if font can render the value.
 */
function resolveDisplayUnit(font: SkFont | null, yAxisUnit: YAxisUnit | undefined): string | undefined {
    if (!yAxisUnit) {
        return undefined;
    }

    // Simple string - use directly
    if (typeof yAxisUnit === 'string') {
        return yAxisUnit;
    }

    // Object with value/fallback - check font support
    if (!font) {
        return yAxisUnit.value;
    }

    if (canFontRenderText(font, yAxisUnit.value)) {
        return yAxisUnit.value;
    }

    return yAxisUnit.fallback;
}

export default function useChartLabelFormats({
    data,
    font,
    yAxisUnit,
    yAxisUnitPosition = 'left',
    labelSkipInterval = 1,
    labelRotation = 0,
    truncatedLabels,
}: UseChartLabelFormatsProps) {
    const {numberFormat} = useLocalize();

    const displayUnit = resolveDisplayUnit(font, yAxisUnit);

    const formatYAxisLabel = useCallback(
        (value: number) => {
            const formatted = numberFormat(value);
            if (!displayUnit) {
                return formatted;
            }
            // Add space for multi-character codes (e.g., "PLN 100") but not for symbols (e.g., "$100")
            const separator = displayUnit.length > 1 ? ' ' : '';
            return yAxisUnitPosition === 'left' ? `${displayUnit}${separator}${formatted}` : `${formatted}${separator}${displayUnit}`;
        },
        [displayUnit, yAxisUnitPosition, numberFormat],
    );

    const formatXAxisLabel = useCallback(
        (value: number) => {
            const index = Math.round(value);

            // Skip labels based on calculated interval
            if (index % labelSkipInterval !== 0) {
                return '';
            }

            // Use pre-truncated labels
            // If rotation is vertical (-90), we usually want full labels
            // because they have more space vertically.
            const sourceToUse = labelRotation === -LABEL_ROTATIONS.VERTICAL || !truncatedLabels ? data.map((p) => p.label) : truncatedLabels;

            return sourceToUse.at(index) ?? '';
        },
        [labelSkipInterval, labelRotation, truncatedLabels, data],
    );

    return {
        formatXAxisLabel,
        formatYAxisLabel,
        displayUnit,
    };
}
