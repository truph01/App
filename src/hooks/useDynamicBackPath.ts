import findMatchingDynamicSuffix from '@libs/Navigation/helpers/dynamicRoutesUtils/findMatchingDynamicSuffix';
import getPathWithoutDynamicSuffix from '@libs/Navigation/helpers/dynamicRoutesUtils/getPathWithoutDynamicSuffix';
import getPathFromState from '@libs/Navigation/helpers/getPathFromState';
import type {State} from '@libs/Navigation/types';
import type {DynamicRouteSuffix, Route} from '@src/ROUTES';
import ROUTES from '@src/ROUTES';
import useRootNavigationState from './useRootNavigationState';

/**
 * Returns the back path for a dynamic route by removing the dynamic suffix from the current URL.
 *
 * Uses the same matching logic as `findMatchingDynamicSuffix` (single source of truth) so static,
 * parametric (required-only), and parametric-with-optional-params suffixes are all handled
 * consistently. The suffix is only removed if the registered pattern actually matches the tail
 * of the current path (so middle-of-path mentions or partial matches are left intact).
 *
 * @param dynamicRouteSuffix - The dynamic route pattern to remove from the current URL.
 * @returns The back path for the dynamic route.
 */
function useDynamicBackPath(dynamicRouteSuffix: DynamicRouteSuffix): Route {
    const path = useRootNavigationState((state) => {
        if (!state) {
            return undefined;
        }

        return getPathFromState(state as State);
    });

    if (!path) {
        return ROUTES.HOME;
    }

    const pathWithoutLeadingSlash = path.replace(/^\/+/, '');
    const match = findMatchingDynamicSuffix(pathWithoutLeadingSlash);
    if (match && match.pattern === dynamicRouteSuffix) {
        return getPathWithoutDynamicSuffix(pathWithoutLeadingSlash, match.actualSuffix, match.pattern);
    }

    return pathWithoutLeadingSlash as Route;
}

export default useDynamicBackPath;
