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
import {rand64} from '@libs/NumberUtils';
import {calculateAmount} from '@libs/IOUUtils';
import {initSplitExpenseItemData} from './IOU/Split';

// We use connectWithoutView because `initSplitExpense` doesn't affect the UI rendering and
// this avoids unnecessary re-rendering for components when any transaction changes. This data should ONLY
// be used for `initSplitExpense`
let allTransactions: OnyxCollection<Transaction>;
Onyx.connectWithoutView({
    key: ONYXKEYS.COLLECTION.TRANSACTION,
    waitForCollectionCallback: true,
    callback: (value) => (allTransactions = value),
});

// We use connectWithoutView because `initSplitExpense` doesn't affect the UI rendering and
// this avoids unnecessary re-rendering for components when any report changes. This data should ONLY
// be used for `initSplitExpense`
let allReports: OnyxCollection<Report>;
Onyx.connectWithoutView({
    key: ONYXKEYS.COLLECTION.REPORT,
    waitForCollectionCallback: true,
    callback: (value) => (allReports = value),
});

/**
 * Create a draft transaction to set up split expense details for the split expense flow
 */
function initSplitExpense(transaction: OnyxEntry<Transaction>) {
    if (!transaction) {
        return;
    }

    const reportID = transaction.reportID ?? String(CONST.DEFAULT_NUMBER_ID);
    const originalTransactionID = transaction?.comment?.originalTransactionID;
    const originalTransaction = allTransactions?.[`${ONYXKEYS.COLLECTION.TRANSACTION}${originalTransactionID}`];
    const {isExpenseSplit} = getOriginalTransactionWithSplitInfo(transaction, originalTransaction);

    if (isExpenseSplit) {
        const relatedTransactions = getChildTransactions(allTransactions, allReports, originalTransactionID);
        const transactionDetails = getTransactionDetails(originalTransaction);
        const splitExpenses = relatedTransactions.map((currentTransaction) => {
            const currentTransactionReport = allReports?.[`${ONYXKEYS.COLLECTION.REPORT}${currentTransaction?.reportID}`];
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
    const transactionReport = allReports?.[`${ONYXKEYS.COLLECTION.REPORT}${transaction?.reportID}`];

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

export default initSplitExpense;
