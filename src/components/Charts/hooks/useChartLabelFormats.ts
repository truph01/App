import type {ChartDataPoint, UnitPosition} from '@components/Charts/types';
import useLocalize from '@hooks/useLocalize';
import {LABEL_ROTATIONS} from './useChartLabelLayout';

type UseChartLabelFormatsProps = {
    data: ChartDataPoint[];
    unit?: string;
    unitPosition?: UnitPosition;
    labelSkipInterval?: number;
    labelRotation?: number;
    truncatedLabels?: string[];
};

export default function useChartLabelFormats({data, unit, unitPosition = 'left', labelSkipInterval = 1, labelRotation = 0, truncatedLabels}: UseChartLabelFormatsProps) {
    const {numberFormat} = useLocalize();

    const formatValue = (value: number) => {
        const formatted = numberFormat(value);
        if (!unit) {
            return formatted;
        }
        // Add space for multi-character codes (e.g., "PLN 100") but not for symbols (e.g., "$100")
        const separator = unit.length > 1 ? ' ' : '';
        return unitPosition === 'left' ? `${unit}${separator}${formatted}` : `${formatted}${separator}${unit}`;
    };

    const formatLabel = (value: number) => {
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
    };

    return {
        formatLabel,
        formatValue,
    };
}
