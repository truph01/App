import {AppStartTimeNitroModule} from '@expensify/nitro-utils';
import {startSpan} from '@libs/telemetry/activeSpans';
import CONST from '@src/CONST';
import setupSentry from './setupSentry';

export default function (): void {
    setupSentry();

    
    let nativeAppStartTimeMs: number | undefined;
    try {
        nativeAppStartTimeMs = AppStartTimeNitroModule.appStartTime;
    } catch (error) {
        nativeAppStartTimeMs = undefined;
    }

    startSpan(CONST.TELEMETRY.SPAN_APP_STARTUP, {
        name: CONST.TELEMETRY.SPAN_APP_STARTUP,
        op: CONST.TELEMETRY.SPAN_APP_STARTUP,
        startTime: nativeAppStartTimeMs ?? undefined,
    });
}
