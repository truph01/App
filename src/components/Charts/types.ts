import type IconAsset from '@src/types/utils/IconAsset';

type ChartDataPoint = {
    /** Label displayed under the data point (e.g., "Amazon", "Nov 2025") */
    label: string;

    /** Total amount (pre-formatted, e.g., dollars not cents) */
    total: number;

    /** Query string for navigation when data point is clicked (optional) */
    onClickQuery?: string;
};

/**
 * Y-axis unit can be either:
 * - A simple string (always displayed as-is)
 * - An object with value and fallback (chart checks if font can render value, uses fallback if not)
 */
type YAxisUnit = string | {value: string; fallback: string};

type YAxisUnitPosition = 'left' | 'right';

type CartesianChartProps = {
    /** Data points to display */
    data: ChartDataPoint[];

    /** Chart title (e.g., "Top Categories", "Spend over time") */
    title?: string;

    /** Icon displayed next to the title */
    titleIcon?: IconAsset;

    /** Whether data is loading */
    isLoading?: boolean;

    /** Symbol/unit for Y-axis labels. Can be a string or an object with value and fallback for font compatibility. */
    yAxisUnit?: YAxisUnit;

    /** Position of the unit symbol relative to the value. Defaults to 'left'. */
    yAxisUnitPosition?: YAxisUnitPosition;
};

export type {ChartDataPoint, CartesianChartProps, YAxisUnit, YAxisUnitPosition};
