import type {CurrencyList} from '@src/types/onyx';

type CurrencyListStateContextType = {
    /** The currency list from Onyx */
    currencyList: CurrencyList;
};

type CurrencyListActionsContextType = {
    /** Function to get currency symbol for a currency(ISO 4217) Code */
    getCurrencySymbol: (currencyCode: string) => string | undefined;
};

export type {CurrencyListStateContextType, CurrencyListActionsContextType};
