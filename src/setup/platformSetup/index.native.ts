import canCapturePerformanceMetrics from '@libs/Metrics';
import Performance from '@libs/Performance';

export default function () {
    if (canCapturePerformanceMetrics()) {
        Performance.enableMonitoring();
    }
}
