/**
 * Configuration types for multifactor authentication UI and scenarios.
 */
import type {ViewStyle} from 'react-native';
import type {EmptyObject, ValueOf} from 'type-fest';
import type {IllustrationName} from '@components/Icon/chunks/illustrations.chunk';
import type DotLottieAnimation from '@components/LottieAnimations/types';
import type {
    AllMultifactorAuthenticationBaseParameters,
    MultifactorAuthenticationActionParams,
    MultifactorAuthenticationKeyInfo,
    MultifactorAuthenticationReason,
} from '@libs/MultifactorAuthentication/Biometrics/types';
import type CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import type SCREENS from '@src/SCREENS';
import type {MULTIFACTOR_AUTHENTICATION_PROMPT_UI, MultifactorAuthenticationScenarioPayload} from './index';

/**
 * Configuration for cancel confirmation modal in multifactor authentication.
 */
type MultifactorAuthenticationCancelConfirm = {
    description?: TranslationPaths;
    cancelButtonText?: TranslationPaths;
    confirmButtonText?: TranslationPaths;
    title?: TranslationPaths;
};

/**
 * Configuration for multifactor authentication prompt display with animation and translations.
 */
type MultifactorAuthenticationPromptConfig = {
    animation: DotLottieAnimation;
    title: TranslationPaths;
    subtitle: TranslationPaths;
};

/**
 * Configuration for displaying multifactor authentication outcomes with illustrations and text.
 */
type MultifactorAuthenticationOutcomeConfig = {
    illustration: IllustrationName;
    iconWidth: number;
    iconHeight: number;
    padding: ViewStyle;
    headerTitle: TranslationPaths;
    title: TranslationPaths;
    description: TranslationPaths;
    customDescription?: React.FunctionComponent;
};

/**
 * Collection of prompts keyed by prompt identifier.
 */
type MultifactorAuthenticationPrompt = Record<string, MultifactorAuthenticationPromptConfig>;

/**
 * Collection of outcomes keyed by an outcome type.
 */
type MultifactorAuthenticationOutcome = Record<string, MultifactorAuthenticationOutcomeConfig>;

/**
 * Configuration for modals in multifactor authentication flows.
 */
type MultifactorAuthenticationModal = {
    cancelConfirmation: MultifactorAuthenticationCancelConfirm;
};

/**
 * Override configuration for modals with partial properties.
 * This allows customization of specific modal aspects without redefining the entire structure.
 * e.g. "Authentication attempt" in the cancel confirmation modal can be changed to "Transaction approval".
 */
type MultifactorAuthenticationModalOptional = {
    cancelConfirmation?: Partial<MultifactorAuthenticationCancelConfirm>;
};

/**
 * Optional outcome configuration with partial properties for scenario overrides.
 */
type MultifactorAuthenticationOutcomeOptional = Record<string, Partial<MultifactorAuthenticationOutcomeConfig>>;

type MultifactorAuthenticationUI = {
    MODALS: MultifactorAuthenticationModal;
    OUTCOMES: MultifactorAuthenticationOutcome;
};

/**
 * Response from a multifactor authentication scenario action.
 */
type MultifactorAuthenticationScenarioResponse = {
    httpCode: number;
    reason: MultifactorAuthenticationReason;
};

/**
 * Multifactor authentication screen identifiers.
 */
type MultifactorAuthenticationScreen = ValueOf<typeof SCREENS.MULTIFACTOR_AUTHENTICATION>;

/**
 * Pure function type for scenario actions that return HTTP response and reason.
 */
type MultifactorAuthenticationScenarioPureMethod<T extends Record<string, unknown>> = (
    params: MultifactorAuthenticationActionParams<T, 'signedChallenge'>,
) => Promise<MultifactorAuthenticationScenarioResponse>;

/**
 * Complete scenario configuration including action, UI, and metadata.
 */
type MultifactorAuthenticationScenarioConfig<T extends Record<string, unknown> = EmptyObject> = {
    action: MultifactorAuthenticationScenarioPureMethod<T>;
    allowedAuthenticationMethods: Array<ValueOf<typeof CONST.MULTIFACTOR_AUTHENTICATION.TYPE>>;
    screen: MultifactorAuthenticationScreen;

    /**
     * Whether the scenario does not require any additional parameters except for the native biometrics data.
     * If it is the case, the scenario needs to be defined as such
     * so the absence of payload will be tolerated at the run-time.
     */
    pure?: true;
} & MultifactorAuthenticationUI;

/**
 * Scenario configuration for custom scenarios with optional overrides.
 */
type MultifactorAuthenticationScenarioCustomConfig<T extends Record<string, unknown> = EmptyObject> = Omit<MultifactorAuthenticationScenarioConfig<T>, 'MODALS' | 'OUTCOMES'> & {
    MODALS?: MultifactorAuthenticationModalOptional;
    OUTCOMES: MultifactorAuthenticationOutcomeOptional;
};

/**
 * Default UI configuration shared across scenarios.
 */
type MultifactorAuthenticationDefaultUIConfig = Pick<MultifactorAuthenticationScenarioConfig<never>, 'MODALS' | 'OUTCOMES'>;

/**
 * Record mapping all scenarios to their configurations.
 */
type MultifactorAuthenticationScenarioConfigRecord = Record<MultifactorAuthenticationScenario, MultifactorAuthenticationScenarioConfig<never>>;

/**
 * Additional parameters specific to a scenario.
 */
type MultifactorAuthenticationScenarioAdditionalParams<T extends MultifactorAuthenticationScenario> = T extends keyof MultifactorAuthenticationScenarioPayload
    ? MultifactorAuthenticationScenarioPayload[T]
    : EmptyObject;

/**
 * Optional authentication factors with scenario-specific parameters.
 */
type MultifactorAuthenticationScenarioParams<T extends MultifactorAuthenticationScenario> = Partial<AllMultifactorAuthenticationBaseParameters> &
    MultifactorAuthenticationScenarioAdditionalParams<T>;

/**
 * All required authentication factors with scenario-specific parameters.
 */
type MultifactorAuthenticationProcessScenarioParameters<T extends MultifactorAuthenticationScenario> = AllMultifactorAuthenticationBaseParameters &
    MultifactorAuthenticationScenarioAdditionalParams<T>;

type MultifactorAuthenticationPromptType = keyof typeof MULTIFACTOR_AUTHENTICATION_PROMPT_UI;

/**
 * Parameters required for biometrics registration scenario.
 */
type RegisterBiometricsParams = MultifactorAuthenticationActionParams<
    {
        keyInfo: MultifactorAuthenticationKeyInfo;
    },
    'validateCode'
>;

/**
 * Type-safe parameters for each multifactor authentication scenario.
 */
type MultifactorAuthenticationScenarioParameters = {
    [key in MultifactorAuthenticationScenario]: MultifactorAuthenticationActionParams<
        key extends keyof MultifactorAuthenticationScenarioPayload ? MultifactorAuthenticationScenarioPayload[key] : EmptyObject,
        'signedChallenge'
    >;
} & {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'REGISTER-BIOMETRICS': RegisterBiometricsParams;
};

/**
 * Identifier for different multifactor authentication scenarios.
 */
type MultifactorAuthenticationScenario = ValueOf<typeof CONST.MULTIFACTOR_AUTHENTICATION.SCENARIO>;

export type {
    MultifactorAuthenticationPrompt,
    MultifactorAuthenticationOutcome,
    MultifactorAuthenticationOutcomeConfig,
    MultifactorAuthenticationModal,
    MultifactorAuthenticationScenarioResponse,
    MultifactorAuthenticationScenarioAdditionalParams,
    MultifactorAuthenticationScenarioParameters,
    MultifactorAuthenticationScenario,
    MultifactorAuthenticationScenarioParams,
    MultifactorAuthenticationPromptType,
    MultifactorAuthenticationScenarioConfig,
    MultifactorAuthenticationUI,
    MultifactorAuthenticationScenarioConfigRecord,
    MultifactorAuthenticationProcessScenarioParameters,
    MultifactorAuthenticationDefaultUIConfig,
    MultifactorAuthenticationScenarioCustomConfig,
};
