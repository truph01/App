import type {MultifactorAuthenticationScenario, MultifactorAuthenticationScenarioAdditionalParams} from '@components/MultifactorAuthentication/config/types';
import type {AuthenticationChallenge, RegistrationChallenge} from '@libs/MultifactorAuthentication/Biometrics/ED25519/types';
import type {AuthTypeInfo, MultifactorAuthenticationReason, OutcomePaths} from '@libs/MultifactorAuthentication/Biometrics/types';

export type ErrorState = {
    reason: MultifactorAuthenticationReason;
    message?: string;
};

export type MultifactorAuthenticationState = {
    /** Current error state - stops the flow and navigates to failure outcome */
    error: ErrorState | undefined;

    /** Continuable error - displayed on current screen without stopping the flow */
    continuableError: ErrorState | undefined;

    /** Validate code entered by user */
    validateCode: string | undefined;

    /** Challenge received from backend for registration (full object with user, rp, challenge) */
    registrationChallenge: RegistrationChallenge | undefined;

    /** Challenge received from backend for authorization (full object with allowCredentials, rpId, challenge) */
    authorizationChallenge: AuthenticationChallenge | undefined;

    /** Whether user approved the soft prompt for biometric setup */
    softPromptApproved: boolean;

    /** Current scenario being executed */
    scenario: MultifactorAuthenticationScenario | undefined;

    /** Additional parameters for the current scenario */
    payload: MultifactorAuthenticationScenarioAdditionalParams<MultifactorAuthenticationScenario> | undefined;

    /** Outcome paths for navigation after authentication completes */
    outcomePaths: OutcomePaths | undefined;

    /** Whether registration step has been completed */
    isRegistrationComplete: boolean;

    /** Whether authorization step has been completed */
    isAuthorizationComplete: boolean;

    /** Whether the entire flow has been completed */
    isFlowComplete: boolean;

    /** Authentication method used (e.g., 'BIOMETRIC_FACE', 'BIOMETRIC_FINGERPRINT') */
    authenticationMethod: AuthTypeInfo | undefined;
};

export type InitPayload = {
    scenario: MultifactorAuthenticationScenario;
    payload: MultifactorAuthenticationScenarioAdditionalParams<MultifactorAuthenticationScenario> | undefined;
    outcomePaths: OutcomePaths;
};

export type Action =
    | {type: 'SET_ERROR'; payload: ErrorState | undefined}
    | {type: 'CLEAR_CONTINUABLE_ERROR'}
    | {type: 'SET_VALIDATE_CODE'; payload: string | undefined}
    | {type: 'SET_REGISTRATION_CHALLENGE'; payload: RegistrationChallenge | undefined}
    | {type: 'SET_AUTHORIZATION_CHALLENGE'; payload: AuthenticationChallenge | undefined}
    | {type: 'SET_SOFT_PROMPT_APPROVED'; payload: boolean}
    | {type: 'SET_SCENARIO'; payload: MultifactorAuthenticationScenario | undefined}
    | {type: 'SET_PAYLOAD'; payload: MultifactorAuthenticationScenarioAdditionalParams<MultifactorAuthenticationScenario> | undefined}
    | {type: 'SET_OUTCOME_PATHS'; payload: OutcomePaths | undefined}
    | {type: 'SET_REGISTRATION_COMPLETE'; payload: boolean}
    | {type: 'SET_AUTHORIZATION_COMPLETE'; payload: boolean}
    | {type: 'SET_FLOW_COMPLETE'; payload: boolean}
    | {type: 'SET_AUTHENTICATION_METHOD'; payload: AuthTypeInfo | undefined}
    | {type: 'INIT'; payload: InitPayload}
    | {type: 'REREGISTER'}
    | {type: 'RESET'};

/** Context value for state - the current MFA state */
export type MultifactorAuthenticationStateContextType = MultifactorAuthenticationState;

/** Context value for actions - dispatch to update state */
export type MultifactorAuthenticationActionsContextType = {
    dispatch: (action: Action) => void;
};
