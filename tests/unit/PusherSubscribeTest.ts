import Log from '@libs/Log';
import Pusher from '@libs/Pusher';
import CONFIG from '@src/CONFIG';
import PusherConnectionManager from '@src/libs/PusherConnectionManager';

/**
 * Tests for Pusher.subscribe() graceful handling when socket is disconnected
 * before the deferred subscription callback runs.
 *
 * This covers the race condition where:
 * 1. Pusher.init() is called and connects
 * 2. Pusher.subscribe() is called, which defers work via InteractionManager
 * 3. Pusher.disconnect() is called (e.g. during "Upgrade Required" teardown)
 * 4. The deferred callback finally runs and finds socket === null
 *
 * Previously, this threw an unhandled error that crashed the app in production.
 */

async function initPusher() {
    PusherConnectionManager.init();
    Pusher.init({
        appKey: CONFIG.PUSHER.APP_KEY,
        cluster: CONFIG.PUSHER.CLUSTER,
        authEndpoint: `${CONFIG.EXPENSIFY.DEFAULT_API_ROOT}api/AuthenticatePusher?`,
    });

    // Flush microtasks so initPromise resolves.
    // Pusher.init() resolves via promise chains (socket.getSocketId().then → resolveInitPromise)
    // which require microtask flushing before initPromise is actually resolved.
    await jest.runAllTimersAsync();
}

describe('Pusher.subscribe', () => {
    beforeEach(() => {
        jest.spyOn(Pusher, 'isSubscribed').mockReturnValue(false);
        jest.spyOn(Pusher, 'isAlreadySubscribing').mockReturnValue(false);
    });

    afterEach(() => {
        Pusher.disconnect();
        jest.restoreAllMocks();
    });

    it('should resolve gracefully when socket is disconnected before subscribe callback runs', async () => {
        // 1. Initialize Pusher and wait for initPromise to resolve
        await initPusher();

        // 2. Start subscribe — captures the already-resolved initPromise
        //    InteractionManager.runAfterInteractions callback is queued but hasn't fired yet
        const subscribePromise = Pusher.subscribe('private-user-123', 'multipleEvents');

        // 3. Disconnect BEFORE the InteractionManager callback runs (sets socket = null)
        //    This simulates the race condition during "Upgrade Required" teardown
        Pusher.disconnect();

        // 4. Flush timers and microtasks so the InteractionManager callback fires
        await jest.runAllTimersAsync();

        // 5. Subscribe should NOT throw — it should resolve gracefully
        await expect(subscribePromise).resolves.toBeUndefined();
    });

    it('should log a message when skipping subscription due to disconnected socket', async () => {
        const logSpy = jest.spyOn(Log, 'info');

        await initPusher();

        const subscribePromise = Pusher.subscribe('private-user-456', 'multipleEvents');
        Pusher.disconnect();

        await jest.runAllTimersAsync();
        await subscribePromise;

        expect(logSpy).toHaveBeenCalledWith('[Pusher] Socket disconnected before subscribe could complete, skipping subscription', false, {
            channelName: 'private-user-456',
            eventName: 'multipleEvents',
        });
    });

    it('should subscribe successfully when socket is connected', async () => {
        await initPusher();

        const subscribePromise = Pusher.subscribe('private-user-789', 'multipleEvents');

        // Flush so InteractionManager callback fires and subscription completes
        await jest.runAllTimersAsync();

        await expect(subscribePromise).resolves.toBeUndefined();
    });
});
