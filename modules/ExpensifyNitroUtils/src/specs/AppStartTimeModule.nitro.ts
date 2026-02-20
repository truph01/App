import type {HybridObject} from 'react-native-nitro-modules';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Nitro HybridObject specs require `interface` to extend HybridObject
interface AppStartTimeModule extends HybridObject<{ios: 'swift'; android: 'kotlin'}> {
    /**
     * Records the app start time.
     * NOTE: This method cannot be called from JS since it must run before React Native
     * initializes. The actual recording is done natively — in MainApplication.onCreate()
     * on Android and AppDelegate.didFinishLaunchingWithOptions() on iOS — by writing
     * directly to SharedPreferences/UserDefaults. This method is kept in the spec for
     * completeness and potential future use.
     */
    recordAppStartTime(): void;

    /**
     * Gets the recorded app start time in milliseconds since epoch.
     * Returns 0 if recordAppStartTime() was never called.
     */
    readonly appStartTime: number;
}

export default AppStartTimeModule;
