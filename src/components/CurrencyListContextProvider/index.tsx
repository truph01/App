import React, {createContext, useCallback, useContext, useMemo, useRef} from 'react';
import useOnyx from '@hooks/useOnyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {CurrencyList} from '@src/types/onyx';
import {getEmptyObject} from '@src/types/utils/EmptyObject';
import {defaultCurrencyListActionsContextValue, defaultCurrencyListStateContextValue} from './default';
import type {CurrencyListActionsContextType, CurrencyListStateContextType} from './types';

const CurrencyListStateContext = createContext<CurrencyListStateContextType>(defaultCurrencyListStateContextValue);
const CurrencyListActionsContext = createContext<CurrencyListActionsContextType>(defaultCurrencyListActionsContextValue);

function CurrencyListContextProvider({children}: React.PropsWithChildren) {
    const [currencyList = getEmptyObject<CurrencyList>()] = useOnyx(ONYXKEYS.CURRENCY_LIST, {canBeMissing: true});

    const currencyListRef = useRef(currencyList);
    currencyListRef.current = currencyList;

    const getCurrencySymbol = useCallback((currencyCode: string): string | undefined => {
        return currencyListRef.current[currencyCode]?.symbol;
    }, []);

    const stateValue = useMemo<CurrencyListStateContextType>(
        () => ({
            currencyList,
        }),
        [currencyList],
    );

    const actionsValue = useMemo<CurrencyListActionsContextType>(
        () => ({
            getCurrencySymbol,
        }),
        [getCurrencySymbol],
    );

    return (
        <CurrencyListStateContext.Provider value={stateValue}>
            <CurrencyListActionsContext.Provider value={actionsValue}>{children}</CurrencyListActionsContext.Provider>
        </CurrencyListStateContext.Provider>
    );
}

function useCurrencyListState(): CurrencyListStateContextType {
    return useContext(CurrencyListStateContext);
}

function useCurrencyListActions(): CurrencyListActionsContextType {
    return useContext(CurrencyListActionsContext);
}

export {CurrencyListContextProvider, CurrencyListStateContext, CurrencyListActionsContext, useCurrencyListState, useCurrencyListActions};
export type {CurrencyListActionsContextType, CurrencyListStateContextType} from './types';
