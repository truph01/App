import {useCallback} from 'react';
import type {OnyxCollection} from 'react-native-onyx';
import useOnyx from '@hooks/useOnyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Transaction} from '@src/types/onyx';
import type {ReportTransactionsAndViolationsDerivedValue} from '@src/types/onyx/DerivedValues';
import {getEmptyObject} from '@src/types/utils/EmptyObject';

function useReportTransactionsCollection(reportID?: string): OnyxCollection<Transaction> {
    const transactionsSelector = useCallback(
        (allReportsTransactionsAndViolations: ReportTransactionsAndViolationsDerivedValue | undefined) => {
            return reportID ? allReportsTransactionsAndViolations?.[reportID]?.transactions : undefined;
        },
        [reportID],
    );

    const [reportTransactions] = useOnyx(ONYXKEYS.DERIVED.REPORT_TRANSACTIONS_AND_VIOLATIONS, {
        canBeMissing: true,
        selector: transactionsSelector,
    });

    return reportTransactions ?? getEmptyObject<OnyxCollection<Transaction>>();
}

export default useReportTransactionsCollection;
