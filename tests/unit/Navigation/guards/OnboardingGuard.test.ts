import type {NavigationAction, NavigationState} from '@react-navigation/native';
import Onyx from 'react-native-onyx';
import OnboardingGuard from '@libs/Navigation/guards/OnboardingGuard';
import type {GuardContext} from '@libs/Navigation/guards/types';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import SCREENS from '@src/SCREENS';
import waitForBatchedUpdates from '../../../utils/waitForBatchedUpdates';

describe('OnboardingGuard', () => {
    const mockState: NavigationState = {
        key: 'root',
        index: 0,
        routeNames: [SCREENS.HOME],
        routes: [{key: 'home', name: SCREENS.HOME}],
        stale: false,
        type: 'root',
    };

    const mockAction: NavigationAction = {
        type: 'NAVIGATE',
        payload: {name: SCREENS.HOME},
    };

    const authenticatedContext: GuardContext = {
        isAuthenticated: true,
        isLoading: false,
        currentUrl: '',
    };

    beforeAll(() => {
        Onyx.init({keys: ONYXKEYS});
    });

    beforeEach(async () => {
        await Onyx.clear();
        await waitForBatchedUpdates();
    });

    describe('early return when onboarding completed', () => {
        it('should return ALLOW when user has completed onboarding', async () => {
            // Given a user who has already completed the guided setup flow, meaning they've finished all onboarding steps
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a standard navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because completed users should not be forced back into onboarding
            expect(result.type).toBe('ALLOW');
        });

        it('should return ALLOW when onboarding data is undefined (old/migrated accounts)', async () => {
            // Given a user with null onboarding data, which indicates an old or migrated account that predates the guided setup flow
            await Onyx.set(ONYXKEYS.NVP_ONBOARDING, null);
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because null onboarding data is treated as "completed" to avoid forcing legacy users through onboarding
            expect(result.type).toBe('ALLOW');
        });
    });

    describe('early exit conditions', () => {
        it('should allow during app transition', () => {
            // Given an authenticated user whose current URL contains a transition path, indicating the app is mid-transition between states
            const transitionContext: GuardContext = {
                isAuthenticated: true,
                isLoading: false,
                currentUrl: 'https://new.expensify.com/transition',
            };

            // When the guard evaluates during the transition
            const result = OnboardingGuard.evaluate(mockState, mockAction, transitionContext);

            // Then navigation should be allowed because the guard should not interfere with app transitions to avoid breaking the transition flow
            expect(result.type).toBe('ALLOW');
        });

        it('should BLOCK RESET action when user is on onboarding and tries to reset to non-onboarding screen', async () => {
            // Given a user who is currently on the onboarding purpose screen and has not yet completed onboarding
            const onboardingState: NavigationState = {
                key: 'root',
                index: 0,
                routeNames: [SCREENS.ONBOARDING.PURPOSE],
                routes: [{key: 'purpose', name: SCREENS.ONBOARDING.PURPOSE}],
                stale: false,
                type: 'root',
            };

            // When a RESET action attempts to navigate them away from onboarding to the HOME screen
            const resetAction: NavigationAction = {
                type: CONST.NAVIGATION_ACTIONS.RESET,
                payload: {
                    key: 'root',
                    index: 0,
                    routeNames: [SCREENS.HOME],
                    routes: [{key: 'home', name: SCREENS.HOME}],
                    stale: false,
                    type: 'root',
                },
            };

            const result = OnboardingGuard.evaluate(onboardingState, resetAction, authenticatedContext) as {type: 'BLOCK'; reason?: string};

            // Then the action should be blocked because users who haven't completed onboarding should not be able to skip it via a RESET action
            expect(result.type).toBe('BLOCK');
            expect(result.reason).toBe('Cannot reset to non-onboarding screen while on onboarding');
        });
    });

    describe('skip onboarding conditions', () => {
        it('should allow when onboarding is completed', async () => {
            // Given a user who has already completed the guided setup flow
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because completed users should bypass all onboarding checks
            expect(result.type).toBe('ALLOW');
        });

        it('should allow migrated users', async () => {
            // Given a user who was migrated from the classic app via the nudge migration flow, which means they already have an established account
            await Onyx.merge(ONYXKEYS.NVP_TRY_NEW_DOT, {
                classicRedirect: {
                    dismissed: false,
                },
                nudgeMigration: {
                    timestamp: new Date(),
                    cohort: 'test',
                },
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because migrated users should skip onboarding since they are already familiar with the product
            expect(result.type).toBe('ALLOW');
        });

        it('should allow users with single entry from HybridApp', async () => {
            // Given a user who entered NewDot as a single-entry from HybridApp, meaning they are temporarily viewing NewDot from the classic app
            await Onyx.merge(ONYXKEYS.HYBRID_APP, {
                isSingleNewDotEntry: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because single-entry HybridApp users should not be forced into onboarding for a temporary visit
            expect(result.type).toBe('ALLOW');
        });

        it('should allow users with non-personal policies', async () => {
            // Given a user who belongs to a non-personal (e.g. corporate) policy, indicating they were added to a workspace
            await Onyx.merge(ONYXKEYS.HAS_NON_PERSONAL_POLICY, true);
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because users with workspace policies should skip the individual onboarding flow
            expect(result.type).toBe('ALLOW');
        });

        it('should allow invited users', async () => {
            // Given a user who was invited and has already selected their intro choice (SUBMIT), indicating they came through an invitation link
            await Onyx.merge(ONYXKEYS.NVP_INTRO_SELECTED, {
                choice: CONST.INTRO_CHOICES.SUBMIT,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext);

            // Then navigation should be allowed because invited users have a predefined purpose and should skip the onboarding purpose selection
            expect(result.type).toBe('ALLOW');
        });
    });

    describe('redirect completed users away from onboarding routes', () => {
        it('should redirect to HOME when completed user navigates to onboarding via deep link (RESET with onboarding screen)', async () => {
            // Given a user who has already completed the guided setup flow
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: true,
            });
            await waitForBatchedUpdates();

            // When a RESET action tries to navigate them to the onboarding purpose screen (e.g. via a deep link like /onboarding/purpose from a Concierge message)
            const resetToOnboardingAction: NavigationAction = {
                type: 'RESET',
                payload: {
                    key: 'root',
                    index: 0,
                    routeNames: [SCREENS.ONBOARDING.PURPOSE],
                    routes: [{key: 'purpose', name: SCREENS.ONBOARDING.PURPOSE}],
                    stale: false,
                    type: 'stack',
                },
            };

            const result = OnboardingGuard.evaluate(mockState, resetToOnboardingAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the user should be redirected to HOME because the onboarding modal is excluded from the navigation stack for completed users, and navigating there would silently fail
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toBe('home');
        });

        it('should ALLOW when completed user navigates to a non-onboarding route', async () => {
            // Given a user who has completed the guided setup flow
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: true,
            });
            await waitForBatchedUpdates();

            // When a RESET action navigates to a non-onboarding screen (HOME)
            const resetToHomeAction: NavigationAction = {
                type: CONST.NAVIGATION_ACTIONS.RESET,
                payload: {
                    key: 'root',
                    index: 0,
                    routeNames: [SCREENS.HOME],
                    routes: [{key: 'home', name: SCREENS.HOME}],
                    stale: false,
                    type: 'root',
                },
            };

            const result = OnboardingGuard.evaluate(mockState, resetToHomeAction, authenticatedContext);

            // Then navigation should be allowed because the redirect-to-HOME logic should only trigger when the RESET target includes an onboarding route
            expect(result.type).toBe('ALLOW');
        });

        it('should ALLOW non-RESET actions for completed users (e.g. NAVIGATE)', async () => {
            // Given a user who has completed the guided setup flow
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: true,
            });
            await waitForBatchedUpdates();

            // When a standard NAVIGATE action (not a RESET) is evaluated
            const navigateAction: NavigationAction = {
                type: 'NAVIGATE',
                payload: {name: SCREENS.HOME},
            };

            const result = OnboardingGuard.evaluate(mockState, navigateAction, authenticatedContext);

            // Then navigation should be allowed because the deep link redirect only applies to RESET actions, which are how deep links resolve in the navigation stack
            expect(result.type).toBe('ALLOW');
        });
    });

    describe('redirect to onboarding', () => {
        it('should redirect when authenticated user needs onboarding', async () => {
            // Given a new user from a public email domain who has not completed the guided setup flow
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: false,
            });
            await Onyx.merge(ONYXKEYS.ACCOUNT, {
                isFromPublicDomain: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action to a non-onboarding screen
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the user should be redirected to onboarding because new users must complete the setup flow before accessing the app
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toContain('onboarding');
        });

        it('should redirect to correct step for users with accessible policies', async () => {
            // Given a user from a private domain with accessible domain policies who has not completed onboarding
            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: false,
            });
            await Onyx.merge(ONYXKEYS.ACCOUNT, {
                isFromPublicDomain: false,
                hasAccessibleDomainPolicies: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action
            const result = OnboardingGuard.evaluate(mockState, mockAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the user should be redirected to onboarding because their domain/policy context determines which onboarding step they should land on
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toContain('onboarding');
        });

        it('should redirect when user tries to access wrong onboarding step', async () => {
            // Given a new user from a public domain who is currently on the onboarding purpose screen but may need to be on a different step
            const onboardingState: NavigationState = {
                key: 'root',
                index: 0,
                routeNames: [SCREENS.ONBOARDING.PURPOSE],
                routes: [{key: 'purpose', name: SCREENS.ONBOARDING.PURPOSE}],
                stale: false,
                type: 'root',
            };

            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: false,
            });
            await Onyx.merge(ONYXKEYS.ACCOUNT, {
                isFromPublicDomain: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action while the user is on a potentially incorrect onboarding step
            const result = OnboardingGuard.evaluate(onboardingState, mockAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the user should be redirected to the correct onboarding step because the guard enforces the proper step sequence
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toContain('onboarding');
        });

        it('should redirect when user in onboarding tries to access non-onboarding path', async () => {
            // Given a new user from a public domain who is currently on the onboarding purpose screen
            const onboardingState: NavigationState = {
                key: 'root',
                index: 0,
                routeNames: [SCREENS.ONBOARDING.PURPOSE],
                routes: [{key: 'purpose', name: SCREENS.ONBOARDING.PURPOSE}],
                stale: false,
                type: 'root',
            };

            // When the user attempts to navigate to the HOME screen before completing onboarding
            const homeAction: NavigationAction = {
                type: 'NAVIGATE',
                payload: {name: SCREENS.HOME},
            };

            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: false,
            });
            await Onyx.merge(ONYXKEYS.ACCOUNT, {
                isFromPublicDomain: true,
            });
            await waitForBatchedUpdates();

            const result = OnboardingGuard.evaluate(onboardingState, homeAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the user should be redirected back to onboarding because they must complete the setup flow before accessing other parts of the app
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toContain('onboarding');
        });

        it('should always redirect to correct onboarding step when user needs onboarding', async () => {
            // Given a new user from a public domain who is currently on the work-email onboarding step but the guard determines they belong on a different step
            const onboardingState: NavigationState = {
                key: 'root',
                index: 0,
                routeNames: [SCREENS.ONBOARDING.WORK_EMAIL],
                routes: [{key: 'work-email', name: SCREENS.ONBOARDING.WORK_EMAIL}],
                stale: false,
                type: 'root',
            };

            await Onyx.merge(ONYXKEYS.NVP_ONBOARDING, {
                hasCompletedGuidedSetupFlow: false,
            });
            await Onyx.merge(ONYXKEYS.ACCOUNT, {
                isFromPublicDomain: true,
            });
            await waitForBatchedUpdates();

            // When the guard evaluates a navigation action while the user is on a specific onboarding step
            const result = OnboardingGuard.evaluate(onboardingState, mockAction, authenticatedContext) as {type: 'REDIRECT'; route: string};

            // Then the guard should redirect to the correct onboarding step because the step sequence is dynamically determined by the user's account state
            expect(result.type).toBe('REDIRECT');
            expect(result.route).toContain('onboarding');
        });
    });
});
