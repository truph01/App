import type IconAsset from '@src/types/utils/IconAsset';

type ChartDataPoint = {
    /** Label displayed under the data point (e.g., "Amazon", "Nov 2025") */
    label: string;

    /** Total amount (pre-formatted, e.g., dollars not cents) */
    total: number;

    /** Query string for navigation when data point is clicked (optional) */
    onClickQuery?: string;
};

type CartesianChartProps = {
    /** Data points to display */
    data: ChartDataPoint[];

    /** Chart title (e.g., "Top Categories", "Spend over time") */
    title?: string;

    /** Icon displayed next to the title */
    titleIcon?: IconAsset;

    /** Whether data is loading */
    isLoading?: boolean;

    /** Symbol/unit for Y-axis labels (e.g., '$', '€', 'zł'). Empty string or undefined shows raw numbers. */
    yAxisUnit?: string;

    /** Position of the unit symbol relative to the value. Defaults to 'left'. */
    yAxisUnitPosition?: YAxisUnitPosition;
};

type PieChartProps = {
    /** Data points to display */
    data: ChartDataPoint[];

    /** Chart title (e.g., "Top Categories", "Spend by Merchant") */
    title?: string;

    /** Icon displayed next to the title */
    titleIcon?: IconAsset;

    /** Whether data is loading */
    isLoading?: boolean;

    /** Callback when a slice is pressed */
    onSlicePress?: (dataPoint: ChartDataPoint, index: number) => void;

    /** Symbol/unit for value labels in tooltip (e.g., '$', '€'). */
    valueUnit?: string;
};

type PieSlice = {
    label: string;
    /** Absolute value used for slice sizing */
    value: number;
    color: string;
    percentage: number;
    startAngle: number;
    endAngle: number;
    originalIndex: number;
};

type YAxisUnitPosition = 'left' | 'right';

export type {ChartDataPoint, CartesianChartProps, PieChartProps, PieSlice, YAxisUnitPosition};
