import type {NavigationAction, NavigationState} from '@react-navigation/native';
import {findFocusedRoute} from '@react-navigation/native';
import {tryNewDotOnyxSelector} from '@selectors/Onboarding';
import Onyx from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import Log from '@libs/Log';
import isProductTrainingElementDismissed from '@libs/TooltipUtils';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import type {DismissedProductTraining} from '@src/types/onyx';
import type {GuardResult, NavigationGuard} from './types';

/**
 * Module-level Onyx subscriptions for MigratedUserWelcomeModalGuard
 */
let hasBeenAddedToNudgeMigration = false;
let dismissedProductTraining: OnyxEntry<DismissedProductTraining>;

let hasRedirectedToMigratedUserModal = false;

/**
 * Reset the session flag (for testing purposes)
 */
function resetSessionFlag() {
    hasRedirectedToMigratedUserModal = false;
}

Onyx.connectWithoutView({
    key: ONYXKEYS.NVP_TRY_NEW_DOT,
    callback: (value) => {
        const result = value ? tryNewDotOnyxSelector(value) : undefined;
        hasBeenAddedToNudgeMigration = result?.hasBeenAddedToNudgeMigration ?? false;
    },
});

Onyx.connectWithoutView({
    key: ONYXKEYS.NVP_DISMISSED_PRODUCT_TRAINING,
    callback: (value) => {
        dismissedProductTraining = value;

        // Reset the session flag when modal is dismissed
        if (isProductTrainingElementDismissed('migratedUserWelcomeModal', value)) {
            hasRedirectedToMigratedUserModal = false;
        }
    },
});

/**
 * Check if navigation should be blocked while the migrated user modal is active.
 * After the guard redirects to the modal, there's a delay before the native Modal overlay becomes visible.
 * During this window, tab switches can push screens on top of the modal navigator,
 * causing DISMISS_MODAL to fail since it only checks the last route.
 */
function shouldBlockWhileModalActive(state: NavigationState, action: NavigationAction): boolean {
    const isModalDismissed = isProductTrainingElementDismissed('migratedUserWelcomeModal', dismissedProductTraining);
    if (!hasRedirectedToMigratedUserModal || isModalDismissed) {
        return false;
    }

    // Only block when the migrated user modal is the LAST route (on top of the stack).
    const lastRoute = state.routes.at(-1);
    if (lastRoute?.name !== NAVIGATORS.MIGRATED_USER_MODAL_NAVIGATOR) {
        return false;
    }

    // Allow DISMISS_MODAL and GO_BACK actions
    if (action.type === CONST.NAVIGATION.ACTION_TYPE.DISMISS_MODAL || action.type === CONST.NAVIGATION.ACTION_TYPE.GO_BACK) {
        return false;
    }

    return true;
}

/**
 * Check if we're already on or navigating to the migrated user modal
 * This prevents redirect loops where our redirect creates new navigation actions
 */
function isNavigatingToMigratedUserModal(state: NavigationState, action: NavigationAction): boolean {
    const currentRoute = findFocusedRoute(state);
    if (currentRoute?.name === SCREENS.MIGRATED_USER_WELCOME_MODAL.ROOT) {
        return true;
    }

    if (action.type === 'RESET' && action.payload) {
        const targetRoute = findFocusedRoute(action.payload as NavigationState);
        if (targetRoute?.name === SCREENS.MIGRATED_USER_WELCOME_MODAL.ROOT) {
            return true;
        }
    }

    return false;
}

/**
 * MigratedUserWelcomeModalGuard handles the migrated user welcome modal flow.
 * This modal appears for users who have been added to nudge migration and haven't dismissed it yet.
 */
const MigratedUserWelcomeModalGuard: NavigationGuard = {
    name: 'MigratedUserWelcomeModalGuard',

    evaluate: (state: NavigationState, action: NavigationAction, context): GuardResult => {
        if (context.isLoading) {
            return {type: 'ALLOW'};
        }

        if (shouldBlockWhileModalActive(state, action)) {
            return {type: 'BLOCK', reason: '[MigratedUserWelcomeModalGuard] Blocking navigation while migrated user modal is active'};
        }

        // Allow if we're already navigating to the modal (prevents redirect loops)
        if (isNavigatingToMigratedUserModal(state, action)) {
            return {type: 'ALLOW'};
        }

        // Skip if already redirected this session
        if (hasRedirectedToMigratedUserModal) {
            return {type: 'ALLOW'};
        }

        // Check if user needs the migrated user welcome modal
        if (hasBeenAddedToNudgeMigration && !isProductTrainingElementDismissed('migratedUserWelcomeModal', dismissedProductTraining)) {
            Log.info('[MigratedUserWelcomeModalGuard] Redirecting to migrated user welcome modal');
            hasRedirectedToMigratedUserModal = true;

            return {
                type: 'REDIRECT',
                route: ROUTES.MIGRATED_USER_WELCOME_MODAL.getRoute(true),
            };
        }

        return {type: 'ALLOW'};
    },
};

export default MigratedUserWelcomeModalGuard;
export {resetSessionFlag};
