import {useDeferredValue, useEffect, useMemo, useState} from 'react';
import CONST from '@src/CONST';
import usePrevious from './usePrevious';

/**
 * This hook filters (and optionally sorts) a dataset based on a search parameter.
 * It utilizes `useDeferredValue` to allow the searchQuery to change rapidly, while more expensive renders that occur using
 * the result of the filtering and sorting are de-prioritized, allowing them to happen in the background.
 */
function useSearchResults<TValue>(data: TValue[], filterData: (datum: TValue, searchInput: string) => boolean, sortData: (data: TValue[]) => TValue[] = (d) => d) {
    const [inputValue, setInputValue] = useState('');
    const deferredInput = useDeferredValue(inputValue);
    const prevData = usePrevious(data);

    const result = useMemo(() => {
        const normalizedSearchQuery = deferredInput.trim().toLowerCase();

        // Create shallow copy of data to prevent mutation. When no search query exists, we pass the full dataset
        // to sortData. If sortData uses Array.sort() (which sorts in place and returns the same reference),
        // the original data array would be mutated.
        const filtered = normalizedSearchQuery.length ? data.filter((item) => filterData(item, normalizedSearchQuery)) : [...data];
        return sortData(filtered);
    }, [data, filterData, deferredInput, sortData]);

    useEffect(() => {
        if (prevData.length <= CONST.SEARCH_ITEM_LIMIT || data.length > CONST.SEARCH_ITEM_LIMIT) {
            return;
        }
        setInputValue('');
    }, [data.length, prevData.length]);

    return [inputValue, setInputValue, result] as const;
}

export default useSearchResults;
