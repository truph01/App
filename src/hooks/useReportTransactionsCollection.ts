import type {OnyxCollection} from 'react-native-onyx';
import {useAllReportsTransactionsAndViolations} from '@components/OnyxListItemProvider';
import type {Transaction} from '@src/types/onyx';
import {getEmptyObject} from '@src/types/utils/EmptyObject';

function useReportTransactionsCollection(reportID?: string): OnyxCollection<Transaction> {
    const allReportsTransactionsAndViolations = useAllReportsTransactionsAndViolations();

    return reportID ? (allReportsTransactionsAndViolations?.[reportID]?.transactions ?? getEmptyObject<OnyxCollection<Transaction>>()) : getEmptyObject<OnyxCollection<Transaction>>();
}

export default useReportTransactionsCollection;
