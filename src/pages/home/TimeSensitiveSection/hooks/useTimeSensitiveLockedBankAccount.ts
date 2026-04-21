import CONST from '@src/CONST';
import type {BankAccountList, Policy} from '@src/types/onyx';

type LockedBankAccount = {
    /** The ID of the locked bank account */
    bankAccountID: number;

    /** The policy name — undefined means personal account */
    policyName?: string;
};

function useTimeSensitiveLockedBankAccount(adminPolicies: Policy[] | undefined, bankAccountList: BankAccountList | undefined) {
    const lockedBankAccounts: LockedBankAccount[] = [];
    const workspaceLockedBankAccountIDs = new Set<number>();

    for (const policy of adminPolicies ?? []) {
        if (policy.achAccount?.state === CONST.BANK_ACCOUNT.STATE.LOCKED && policy.achAccount.bankAccountID) {
            lockedBankAccounts.push({bankAccountID: policy.achAccount.bankAccountID, policyName: policy.name});
            workspaceLockedBankAccountIDs.add(policy.achAccount.bankAccountID);
        }
    }

    for (const account of Object.values(bankAccountList ?? {})) {
        const {bankAccountID, state} = account.accountData ?? {};
        if (state === CONST.BANK_ACCOUNT.STATE.LOCKED && bankAccountID && !workspaceLockedBankAccountIDs.has(bankAccountID)) {
            lockedBankAccounts.push({bankAccountID});
        }
    }

    return {
        lockedBankAccounts,
    };
}

export default useTimeSensitiveLockedBankAccount;
