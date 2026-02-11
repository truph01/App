import * as Sentry from '@sentry/react-native';
import {browserProfilingIntegration, navigationIntegration, shouldCreateSpanForRequest} from './integrations.common';

const tracingIntegration = Sentry.reactNativeTracingIntegration({
    shouldCreateSpanForRequest,
});

export {navigationIntegration, tracingIntegration, browserProfilingIntegration};
