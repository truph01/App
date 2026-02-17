import {initSplitExpenseItemData} from '@libs/actions/IOU/Split';
import isSearchTopmostFullScreenRoute from '@libs/Navigation/helpers/isSearchTopmostFullScreenRoute';
import {getTransactionDetails} from '@libs/ReportUtils';
import {getOriginalTransactionWithSplitInfo, getChildTransactions, buildOptimisticTransaction} from '@libs/TransactionUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {Transaction, Report} from '@src/types/onyx';
import type {Attendee} from '@src/types/onyx/IOU';
import CONST from '@src/CONST';
import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import Onyx from 'react-native-onyx';
import Navigation from '@libs/Navigation/Navigation';
import {calculateAmount, calculateAmount} from '@libs/IOUUtils';
import {rand64} from '@libs/NumberUtils';

/**
 * Create a draft transaction to set up split expense details for the split expense flow
 */
function useSplitExpense(transactions: OnyxCollection<Transaction>, reports: OnyxCollection<Report>, transaction: OnyxEntry<Transaction>) {
    function initSplit() {
        if (!transaction) {
            return;
        }

        const reportID = transaction.reportID ?? String(CONST.DEFAULT_NUMBER_ID);
        const originalTransactionID = transaction?.comment?.originalTransactionID;
        const originalTransaction = transactions?.[`${ONYXKEYS.COLLECTION.TRANSACTION}${originalTransactionID}`];
        const {isExpenseSplit} = getOriginalTransactionWithSplitInfo(transaction, originalTransaction);

        if (isExpenseSplit) {
            const relatedTransactions = getChildTransactions(transactions, reports, originalTransactionID);
            const transactionDetails = getTransactionDetails(originalTransaction);
            const splitExpenses = relatedTransactions.map((currentTransaction) => {
                const currentTransactionReport = reports?.[`${ONYXKEYS.COLLECTION.REPORT}${currentTransaction?.reportID}`];
                return initSplitExpenseItemData(currentTransaction, currentTransactionReport, {isManuallyEdited: true});
            });
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

            Onyx.set(`${ONYXKEYS.COLLECTION.SPLIT_TRANSACTION_DRAFT}${originalTransactionID}`, draftTransaction);
            if (isSearchTopmostFullScreenRoute()) {
                Navigation.navigate(ROUTES.SPLIT_EXPENSE_SEARCH.getRoute(reportID, originalTransactionID, transaction.transactionID, Navigation.getActiveRoute()));
            } else {
                Navigation.navigate(ROUTES.SPLIT_EXPENSE.getRoute(reportID, originalTransactionID, transaction.transactionID, Navigation.getActiveRoute()));
            }
            return;
        }

        const transactionDetails = getTransactionDetails(transaction);
        const transactionDetailsAmount = transactionDetails?.amount ?? 0;
        const transactionReport = reports?.[`${ONYXKEYS.COLLECTION.REPORT}${transaction?.reportID}`];

        const splitExpenses = [
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
                splitExpenses,
                splitExpensesTotal: splitExpenses.reduce((total, item) => total + item.amount, 0),
                amount: transactionDetailsAmount,
                currency: transactionDetails?.currency ?? CONST.CURRENCY.USD,
                merchant: transactionDetails?.merchant ?? '',
                participants: transaction?.participants,
                attendees: transactionDetails?.attendees as Attendee[],
                reportID,
                reimbursable: transactionDetails?.reimbursable,
            },
        });

        Onyx.set(`${ONYXKEYS.COLLECTION.SPLIT_TRANSACTION_DRAFT}${transaction?.transactionID}`, draftTransaction);

        if (isSearchTopmostFullScreenRoute()) {
            Navigation.navigate(ROUTES.SPLIT_EXPENSE_SEARCH.getRoute(reportID, transaction.transactionID, undefined, Navigation.getActiveRoute()));
        } else {
            Navigation.navigate(ROUTES.SPLIT_EXPENSE.getRoute(reportID, transaction.transactionID, undefined, Navigation.getActiveRoute()));
        }
    }

    return {initSplit};
}

export default useSplitExpense;
