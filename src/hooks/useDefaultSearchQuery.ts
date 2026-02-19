import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import {isPaidGroupPolicy} from '@libs/PolicyUtils';
import {buildCannedSearchQuery, buildQueryStringFromFilterFormValues} from '@libs/SearchQueryUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Policy, Session} from '@src/types/onyx';
import useOnyx from './useOnyx';

type MinimalPolicySummary = {
    approver: string | undefined;
    approvalMode: string | undefined;
    employeeList: Record<string, {submitsTo?: string; forwardsTo?: string}> | undefined;
};

const policyCollectionSelector = (policies: OnyxCollection<Policy>): MinimalPolicySummary[] | undefined => {
    if (!policies) {
        return undefined;
    }

    const result: MinimalPolicySummary[] = [];
    for (const policy of Object.values(policies)) {
        if (!policy || !isPaidGroupPolicy(policy)) {
            continue;
        }
        result.push({
            approver: policy.approver,
            approvalMode: policy.approvalMode,
            employeeList: policy.employeeList,
        });
    }
    return result;
};

const sessionSelector = (session: OnyxEntry<Session>) => ({
    email: session?.email,
    accountID: session?.accountID,
});

/**
 * Lightweight hook that computes only the default actionable search query string.
 *
 * This replaces the heavy `useSearchTypeMenuSections` hook for components like
 * NavigationTabBar that only need the default search query to navigate to the
 * Search tab, rather than the full menu section structure.
 *
 * The logic mirrors `getDefaultActionableSearchMenuItem` from SearchUIUtils:
 * 1. If APPROVE is visible → return APPROVE query
 * 2. If any paid policy exists → return SUBMIT query
 * 3. Otherwise → return default canned search query (expenses)
 */
function useDefaultSearchQuery(): string {
    const [session] = useOnyx(ONYXKEYS.SESSION, {selector: sessionSelector, canBeMissing: false});
    const [paidPolicies] = useOnyx(ONYXKEYS.COLLECTION.POLICY, {
        selector: policyCollectionSelector,
        canBeMissing: true,
    });

    const accountID = session?.accountID;
    const email = session?.email;

    if (!paidPolicies || paidPolicies.length === 0 || !accountID) {
        return buildCannedSearchQuery();
    }

    let isApproveVisible = false;
    for (const policy of paidPolicies) {
        const isApprovalEnabled = policy.approvalMode ? policy.approvalMode !== CONST.POLICY.APPROVAL_MODE.OPTIONAL : false;
        if (!isApprovalEnabled) {
            continue;
        }

        const isApprover = policy.approver === email;
        const isSubmittedTo = Object.values(policy.employeeList ?? {}).some((employee) => employee.submitsTo === email || employee.forwardsTo === email);

        if (isApprover || isSubmittedTo) {
            isApproveVisible = true;
            break;
        }
    }

    if (isApproveVisible) {
        return buildQueryStringFromFilterFormValues({
            type: CONST.SEARCH.DATA_TYPES.EXPENSE_REPORT,
            action: CONST.SEARCH.ACTION_FILTERS.APPROVE,
            to: [`${accountID}`],
        });
    }

    return buildQueryStringFromFilterFormValues({
        type: CONST.SEARCH.DATA_TYPES.EXPENSE_REPORT,
        action: CONST.SEARCH.ACTION_FILTERS.SUBMIT,
        from: [`${accountID}`],
    });
}

export default useDefaultSearchQuery;
