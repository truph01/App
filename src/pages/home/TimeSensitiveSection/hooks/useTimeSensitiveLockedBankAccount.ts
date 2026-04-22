import {primaryLoginSelector} from '@selectors/Account';
import useOnyx from '@hooks/useOnyx';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {BankAccountList, Policy} from '@src/types/onyx';
import {getEmptyObject} from '@src/types/utils/EmptyObject';

type LockedBankAccount = {
    /** The ID of the locked bank account */
    bankAccountID: number;

    /** The policy name — undefined means personal account */
    policyName?: string;
};

function useTimeSensitiveLockedBankAccount(adminPolicies: Policy[] | undefined) {
    const [bankAccountList = getEmptyObject<BankAccountList>()] = useOnyx(ONYXKEYS.BANK_ACCOUNT_LIST);
    const [primaryLogin] = useOnyx(ONYXKEYS.ACCOUNT, {selector: primaryLoginSelector});
    const lockedBankAccounts: LockedBankAccount[] = [];
    const workspaceLockedBankAccountIDs = new Set<number>();

    for (const policy of adminPolicies ?? []) {
        const achAccount = policy.achAccount;
        if (achAccount?.state !== CONST.BANK_ACCOUNT.STATE.LOCKED || !achAccount.bankAccountID) {
            continue;
        }

        workspaceLockedBankAccountIDs.add(achAccount.bankAccountID);
        const isCurrentUserReimburser = !!primaryLogin && achAccount.reimburser === primaryLogin;
        if (!isCurrentUserReimburser) {
            continue;
        }

        lockedBankAccounts.push({bankAccountID: achAccount.bankAccountID, policyName: policy.name});
    }

    for (const account of Object.values(bankAccountList)) {
        const {bankAccountID, state} = account?.accountData ?? {};
        if (state === CONST.BANK_ACCOUNT.STATE.LOCKED && bankAccountID && !workspaceLockedBankAccountIDs.has(bankAccountID)) {
            lockedBankAccounts.push({bankAccountID});
        }
    }

    return {
        lockedBankAccounts,
    };
}

export default useTimeSensitiveLockedBankAccount;
