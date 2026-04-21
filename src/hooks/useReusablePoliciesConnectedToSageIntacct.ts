import ONYXKEYS from '@src/ONYXKEYS';
import {reusablePoliciesConnectedToSageIntacctSelector} from '@src/selectors/Policy';
import useOnyx from './useOnyx';

function useReusablePoliciesConnectedToSageIntacct(policyID: string | undefined) {
    const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
    const reusablePoliciesConnectedToSageIntacct = reusablePoliciesConnectedToSageIntacctSelector(policies, policyID);

    return {
        hasReusablePoliciesConnectedToSageIntacct: reusablePoliciesConnectedToSageIntacct.length > 0,
        reusablePoliciesConnectedToSageIntacct,
    };
}

export default useReusablePoliciesConnectedToSageIntacct;
