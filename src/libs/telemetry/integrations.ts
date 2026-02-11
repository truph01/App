import * as SentryReact from '@sentry/react';
import * as Sentry from '@sentry/react-native';
import {Platform} from 'react-native';

const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
});

const shouldCreateSpanForRequest = (url: string): boolean => {
    const filteredPhrases = ['/api/Log', 'firebaselogging-pa.googleapis.com', 'analytics.google.com', 'rs.fullstory.com', 'api.github.com'];
    return !filteredPhrases.some((phrase) => url.includes(phrase));
};

/**
 * Disable browser tracing integration on Android and iOS because it crashes on mobile in release builds.
 * On the Web we need this to enable web health measurements such as INP, LCP, FCP, CLS.
 * We need to configure this integration manually so there is no data duplication in sentry created by having both the React Native and React Web integrations enabled.
 */
const tracingIntegration =
    Platform.OS === 'android' || Platform.OS === 'ios'
        ? Sentry.reactNativeTracingIntegration({
              shouldCreateSpanForRequest,
          })
        : SentryReact.browserTracingIntegration({
              shouldCreateSpanForRequest,
          });

const browserProfilingIntegration = SentryReact.browserProfilingIntegration();

export {navigationIntegration, tracingIntegration, browserProfilingIntegration};
