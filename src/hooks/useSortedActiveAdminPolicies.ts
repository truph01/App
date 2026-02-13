import {useMemo} from 'react';
import useActiveAdminPolicies from './useActiveAdminPolicies';
import useLocalize from './useLocalize';

function useSortedActiveAdminPolicies() {
    const {localeCompare} = useLocalize();
    const activeAdminPolicies = useActiveAdminPolicies();
    const sortedActiveAdminPolicies = useMemo(() => activeAdminPolicies?.sort((a, b) => localeCompare(a.name || '', b.name || '')) ?? [], [activeAdminPolicies, localeCompare]);

    return sortedActiveAdminPolicies;
}

export default useSortedActiveAdminPolicies;
