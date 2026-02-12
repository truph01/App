import {activeAdminPoliciesSelector} from '@selectors/Policy';
import {useCallback} from 'react';
import type {OnyxCollection} from 'react-native-onyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Policy} from '@src/types/onyx';
import useCurrentUserPersonalDetails from './useCurrentUserPersonalDetails';
import useOnyx from './useOnyx';

function useActiveAdminPolicies() {
    const {login} = useCurrentUserPersonalDetails();
    const selector = useCallback((policies: OnyxCollection<Policy>) => activeAdminPoliciesSelector(policies, login ?? ''), [login]);
    const [activeAdminPolicies] = useOnyx(ONYXKEYS.COLLECTION.POLICY, {canBeMissing: true, selector}, [login]);
    return activeAdminPolicies;
}

export default useActiveAdminPolicies;
