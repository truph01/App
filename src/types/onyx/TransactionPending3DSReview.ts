/**
 * Minimal transaction data needed to render the MFA authorize transaction preview.
 * This is stored under the `transactionsPending3DSReview` Onyx key.
 */
type TransactionPending3DSReview = {
    /** Transaction amount in cents */
    amount: number;

    /** Transaction currency */
    currency: string;

    /** Merchant name */
    merchant: string;

    /** Created date (YYYY-MM-DD or full timestamp, depending on source) */
    created: string;

    /** Last 4 digits of the card PAN */
    lastFourPAN: number;

    /** Optional reportID if the backend provides it */
    reportID?: string;

    /** Optional transactionID if the backend provides it */
    transactionID?: string;
};

export default TransactionPending3DSReview;
