import ONYXKEYS from '@src/ONYXKEYS';
import {reusablePoliciesConnectedToNetSuiteSelector} from '@src/selectors/Policy';
import useOnyx from './useOnyx';

function useReusablePoliciesConnectedToNetSuite(policyID: string | undefined) {
    const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
    const reusablePoliciesConnectedToNetSuite = reusablePoliciesConnectedToNetSuiteSelector(policies, policyID);

    return {
        hasReusablePoliciesConnectedToNetSuite: reusablePoliciesConnectedToNetSuite.length > 0,
        reusablePoliciesConnectedToNetSuite,
    };
}

export default useReusablePoliciesConnectedToNetSuite;
