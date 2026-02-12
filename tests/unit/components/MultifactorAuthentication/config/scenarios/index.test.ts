import MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG from '@components/MultifactorAuthentication/config/scenarios';
import type {MultifactorAuthenticationScenarioConfigRecord} from '@components/MultifactorAuthentication/config/types';
import CONST from '@src/CONST';
import SCREENS from '@src/SCREENS';

describe('MultifactorAuthentication Scenarios Config', () => {
    it('should have all required properties for every scenario config', () => {
        const config = MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG as MultifactorAuthenticationScenarioConfigRecord;

        for (const scenarioConfig of Object.values(config)) {
            expect(scenarioConfig).toHaveProperty('MODALS');
            expect(scenarioConfig.MODALS).toHaveProperty('cancelConfirmation');

            const cancelConfirmation = scenarioConfig.MODALS.cancelConfirmation;
            expect(cancelConfirmation).toHaveProperty('title');
            expect(cancelConfirmation).toHaveProperty('description');
            expect(cancelConfirmation).toHaveProperty('confirmButtonText');
            expect(cancelConfirmation).toHaveProperty('cancelButtonText');

            expect(scenarioConfig).toHaveProperty('successScreen');
            expect(scenarioConfig).toHaveProperty('defaultClientFailureScreen');
            expect(scenarioConfig).toHaveProperty('defaultServerFailureScreen');
        }
    });

    it('should have all required action properties for each scenario', () => {
        const config = MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG as MultifactorAuthenticationScenarioConfigRecord;

        for (const scenarioConfig of Object.values(config)) {
            expect(scenarioConfig).toHaveProperty('action');
            expect(scenarioConfig).toHaveProperty('allowedAuthenticationMethods');
            expect(scenarioConfig).toHaveProperty('screen');
        }
    });

    it('should have BIOMETRICS_TEST scenario properly configured', () => {
        const config = MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG as MultifactorAuthenticationScenarioConfigRecord;
        const biometricsTestScenario = config[CONST.MULTIFACTOR_AUTHENTICATION.SCENARIO.BIOMETRICS_TEST];

        expect(biometricsTestScenario).toBeDefined();
        expect(biometricsTestScenario.allowedAuthenticationMethods).toStrictEqual([CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS]);
        expect(biometricsTestScenario.screen).toBe(SCREENS.MULTIFACTOR_AUTHENTICATION.BIOMETRICS_TEST);
        expect(biometricsTestScenario.pure).toBe(true);
        expect(biometricsTestScenario.action).toBeDefined();
    });

    it('should properly merge default and custom failure screen overrides', () => {
        const config = MULTIFACTOR_AUTHENTICATION_SCENARIO_CONFIG as MultifactorAuthenticationScenarioConfigRecord;
        const biometricsTestConfig = config[CONST.MULTIFACTOR_AUTHENTICATION.SCENARIO.BIOMETRICS_TEST];

        expect(biometricsTestConfig.failureScreens).toHaveProperty(CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.NO_ELIGIBLE_METHODS);
        expect(biometricsTestConfig.failureScreens).toHaveProperty(CONST.MULTIFACTOR_AUTHENTICATION.REASON.GENERIC.UNSUPPORTED_DEVICE);
        expect(biometricsTestConfig.failureScreens).toHaveProperty(CONST.MULTIFACTOR_AUTHENTICATION.REASON.BACKEND.TOO_MANY_ATTEMPTS);
        expect(biometricsTestConfig.failureScreens).toHaveProperty(CONST.MULTIFACTOR_AUTHENTICATION.REASON.EXPO.CANCELED);
    });
});
