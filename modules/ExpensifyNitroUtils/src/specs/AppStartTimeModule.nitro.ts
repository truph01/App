import type {HybridObject} from 'react-native-nitro-modules';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface AppStartTimeModule extends HybridObject<{ios: 'swift'; android: 'kotlin'}> {
    /**
     * Records the app start time. This should be called as early as possible
     * in the native app lifecycle (before React Native initializes).
     */
    recordAppStartTime(): void;

    /**
     * Gets the recorded app start time in milliseconds since epoch.
     * Returns 0 if recordAppStartTime() was never called.
     */
    readonly appStartTime: number;
}

export default AppStartTimeModule;
