import React, {useCallback, useMemo} from 'react';
import {LineChart} from '@components/Charts';
import type {ChartDataPoint} from '@components/Charts';
import {convertToFrontendAmountAsInteger} from '@libs/CurrencyUtils';
import type {SearchChartProps} from './types';

function SearchLineChart({data, title, titleIcon, getLabel, getFilterQuery, onItemPress, isLoading, yAxisUnit, yAxisUnitPosition}: SearchChartProps) {
    const chartData: ChartDataPoint[] = useMemo(() => {
        return data.map((item) => {
            const currency = item.currency ?? 'USD';
            const totalInDisplayUnits = convertToFrontendAmountAsInteger(item.total ?? 0, currency);

            return {
                label: getLabel(item),
                total: totalInDisplayUnits,
            };
        });
    }, [data, getLabel]);

    const handlePointPress = useCallback(
        (dataPoint: ChartDataPoint, index: number) => {
            if (!onItemPress) {
                return;
            }

            const item = data.at(index);
            if (!item) {
                return;
            }

            const filterQuery = getFilterQuery(item);
            onItemPress(filterQuery);
        },
        [data, getFilterQuery, onItemPress],
    );

    return (
        <LineChart
            data={chartData}
            title={title}
            titleIcon={titleIcon}
            isLoading={isLoading}
            onPointPress={handlePointPress}
            yAxisUnit={yAxisUnit}
            yAxisUnitPosition={yAxisUnitPosition}
        />
    );
}

SearchLineChart.displayName = 'SearchLineChart';

export default SearchLineChart;
