import {initSplitExpenseItemData} from '@libs/actions/IOU/Split';
import isSearchTopmostFullScreenRoute from '@libs/Navigation/helpers/isSearchTopmostFullScreenRoute';
import {getTransactionDetails} from '@libs/ReportUtils';
import {getOriginalTransactionWithSplitInfo, getChildTransactions, buildOptimisticTransaction} from '@libs/TransactionUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {Report, Transaction} from '@src/types/onyx';
import type {SplitExpense, Attendee} from '@src/types/onyx/IOU';
import CONST from '@src/CONST';
import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import Navigation from '@libs/Navigation/Navigation';
import {calculateAmount} from '@libs/IOUUtils';
import {rand64} from '@libs/NumberUtils';
import getEmptyArray from '@src/types/utils/getEmptyArray';
import {createDraftTransaction} from '@libs/actions/TransactionEdit';
import {useCallback} from 'react';
import useOnyx from './useOnyx';

/**
 * Create a draft transaction to set up split expense details for the split expense flow
 */
function useSplitExpense(transactions: OnyxCollection<Transaction>, transaction: OnyxEntry<Transaction>) {
    const reportID = transaction?.reportID ?? String(CONST.DEFAULT_NUMBER_ID);
    const originalTransactionID = transaction?.comment?.originalTransactionID;

    const splitExpensesSelector = useCallback(
        (reports: OnyxCollection<Report>) => {
            const relatedTransactions = getChildTransactions(transactions, reports, originalTransactionID);
            const splitExpenses = relatedTransactions.map((currentTransaction) => {
                const currentTransactionReport = reports?.[`${ONYXKEYS.COLLECTION.REPORT}${currentTransaction?.reportID}`];
                return initSplitExpenseItemData(currentTransaction, currentTransactionReport, {isManuallyEdited: true});
            });
            return splitExpenses;
        },
        [transactions, originalTransactionID],
    );

    const [transactionReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${reportID}`, {canBeMissing: true});
    const [originalTransaction] = useOnyx(`${ONYXKEYS.COLLECTION.TRANSACTION}${originalTransactionID}`, {canBeMissing: true});
    const [splitExpenses = getEmptyArray<SplitExpense>()] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}`, {
        canBeMissing: true,
        selector: splitExpensesSelector,
    });

    function startSplitExpenseFlow() {
        if (!transaction) {
            return;
        }

        const {isExpenseSplit} = getOriginalTransactionWithSplitInfo(transaction, originalTransaction);

        if (isExpenseSplit) {
            const transactionDetails = getTransactionDetails(originalTransaction);
            const draftTransaction = buildOptimisticTransaction({
                originalTransactionID,
                transactionParams: {
                    splitExpenses,
                    splitExpensesTotal: splitExpenses.reduce((total, item) => total + item.amount, 0),
                    amount: transactionDetails?.amount ?? 0,
                    currency: transactionDetails?.currency ?? CONST.CURRENCY.USD,
                    participants: transaction?.participants,
                    merchant: transaction?.modifiedMerchant ? transaction.modifiedMerchant : (transaction?.merchant ?? ''),
                    attendees: transactionDetails?.attendees as Attendee[],
                    reportID,
                    reimbursable: transactionDetails?.reimbursable,
                },
            });

            createDraftTransaction(draftTransaction);

            if (isSearchTopmostFullScreenRoute()) {
                Navigation.navigate(ROUTES.SPLIT_EXPENSE_SEARCH.getRoute(reportID, originalTransactionID, transaction.transactionID, Navigation.getActiveRoute()));
            } else {
                Navigation.navigate(ROUTES.SPLIT_EXPENSE.getRoute(reportID, originalTransactionID, transaction.transactionID, Navigation.getActiveRoute()));
            }
            return;
        }

        const transactionDetails = getTransactionDetails(transaction);
        const transactionDetailsAmount = transactionDetails?.amount ?? 0;

        const splitExpenseData = [
            initSplitExpenseItemData(transaction, transactionReport, {
                amount: calculateAmount(1, transactionDetailsAmount, transactionDetails?.currency ?? '', false) ?? 0,
                transactionID: rand64(),
                isManuallyEdited: false,
            }),
            initSplitExpenseItemData(transaction, transactionReport, {
                amount: calculateAmount(1, transactionDetailsAmount, transactionDetails?.currency ?? '', true) ?? 0,
                transactionID: rand64(),
                isManuallyEdited: false,
            }),
        ];

        const draftTransaction = buildOptimisticTransaction({
            originalTransactionID: transaction.transactionID,
            transactionParams: {
                splitExpenses: splitExpenseData,
                splitExpensesTotal: splitExpenseData.reduce((total, item) => total + item.amount, 0),
                amount: transactionDetailsAmount,
                currency: transactionDetails?.currency ?? CONST.CURRENCY.USD,
                merchant: transactionDetails?.merchant ?? '',
                participants: transaction?.participants,
                attendees: transactionDetails?.attendees as Attendee[],
                reportID,
                reimbursable: transactionDetails?.reimbursable,
            },
        });

        createDraftTransaction(draftTransaction);

        if (isSearchTopmostFullScreenRoute()) {
            Navigation.navigate(ROUTES.SPLIT_EXPENSE_SEARCH.getRoute(reportID, transaction.transactionID, undefined, Navigation.getActiveRoute()));
        } else {
            Navigation.navigate(ROUTES.SPLIT_EXPENSE.getRoute(reportID, transaction.transactionID, undefined, Navigation.getActiveRoute()));
        }
    }

    return {startSplitExpenseFlow};
}

export default useSplitExpense;
