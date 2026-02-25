import CONST from '@src/CONST';
import type {QBOConnectionConfig} from '@src/types/onyx/Policy';

function shouldShowLocationsLineItemsRestriction(config?: QBOConnectionConfig): boolean {
    const isJournalEntry = config?.reimbursableExpensesExportDestination === CONST.QUICKBOOKS_REIMBURSABLE_ACCOUNT_TYPE.JOURNAL_ENTRY;
    const isCreditOrDebitCard =
        config?.nonReimbursableExpensesExportDestination === CONST.QUICKBOOKS_NON_REIMBURSABLE_ACCOUNT_TYPE.CREDIT_CARD ||
        config?.nonReimbursableExpensesExportDestination === CONST.QUICKBOOKS_NON_REIMBURSABLE_ACCOUNT_TYPE.DEBIT_CARD;
    return !(isJournalEntry && isCreditOrDebitCard);
}

function shouldSwitchLocationsToReportFields(config?: QBOConnectionConfig): boolean {
    return config?.syncLocations === CONST.INTEGRATION_ENTITY_MAP_TYPES.TAG && shouldShowLocationsLineItemsRestriction(config);
}

export {shouldShowLocationsLineItemsRestriction, shouldSwitchLocationsToReportFields};
