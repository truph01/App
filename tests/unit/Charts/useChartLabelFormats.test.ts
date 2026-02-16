import type {SkFont} from '@shopify/react-native-skia';
import {renderHook} from '@testing-library/react-native';
import useChartLabelFormats from '@components/Charts/hooks/useChartLabelFormats';
import type {ChartDataPoint} from '@components/Charts/types';

let mockNumberFormat: (n: number, opts?: Intl.NumberFormatOptions) => string;

jest.mock('@hooks/useLocalize', () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({
        numberFormat: mockNumberFormat,
    }),
}));

function createMockFont(supportedChars: Set<string>): SkFont {
    return {
        getGlyphIDs: (text: string) => Array.from(text).map((char) => (supportedChars.has(char) ? 1 : 0)),
    } as unknown as SkFont;
}

const SAMPLE_DATA: ChartDataPoint[] = [
    {label: 'Jan', total: 100},
    {label: 'Feb', total: 200},
];

beforeEach(() => {
    mockNumberFormat = (n: number) => n.toLocaleString('en-US');
});

describe('useChartLabelFormats', () => {
    it('falls back to currency code when font cannot render the symbol', () => {
        const font = createMockFont(new Set(['$']));
        const {result} = renderHook(() =>
            useChartLabelFormats({
                data: SAMPLE_DATA,
                font,
                yAxisUnit: {value: '₹', fallback: 'INR'},
                yAxisUnitPosition: 'left',
            }),
        );

        expect(result.current.formatYAxisLabel(100)).toBe('INR 100');
    });

    it('keeps the symbol when font supports it', () => {
        const font = createMockFont(new Set(['$']));
        const {result} = renderHook(() =>
            useChartLabelFormats({
                data: SAMPLE_DATA,
                font,
                yAxisUnit: {value: '$', fallback: 'USD'},
                yAxisUnitPosition: 'left',
            }),
        );

        expect(result.current.formatYAxisLabel(100)).toBe('$100');
    });

    it('updates unit and position when locale changes', () => {
        const font = createMockFont(new Set(['$', '€']));

        mockNumberFormat = (n: number) => n.toLocaleString('en-US');
        const {result, rerender} = renderHook(
            ({unit, position}: {unit: {value: string; fallback: string}; position: 'left' | 'right'}) =>
                useChartLabelFormats({
                    data: SAMPLE_DATA,
                    font,
                    yAxisUnit: unit,
                    yAxisUnitPosition: position,
                }),
            {initialProps: {unit: {value: '$', fallback: 'USD'}, position: 'left' as const}},
        );

        expect(result.current.formatYAxisLabel(1000)).toBe('$1,000');

        mockNumberFormat = (n: number) => n.toLocaleString('de-DE');
        rerender({unit: {value: '€', fallback: 'EUR'}, position: 'right'});

        expect(result.current.formatYAxisLabel(1000)).toBe('1.000€');
    });
});
