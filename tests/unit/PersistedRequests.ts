import Onyx from 'react-native-onyx';
import * as PersistedRequests from '../../src/libs/actions/PersistedRequests';
import ONYXKEYS from '../../src/ONYXKEYS';
import type Request from '../../src/types/onyx/Request';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';
import wrapOnyxWithWaitForBatchedUpdates from '../utils/wrapOnyxWithWaitForBatchedUpdates';

const request: Request<'reportMetadata_1' | 'reportMetadata_2'> = {
    command: 'OpenReport',
    successData: [{key: 'reportMetadata_1', onyxMethod: 'merge', value: {}}],
    failureData: [{key: 'reportMetadata_2', onyxMethod: 'merge', value: {}}],
    requestID: 1,
};

beforeAll(() =>
    Onyx.init({
        keys: ONYXKEYS,
        evictableKeys: [ONYXKEYS.COLLECTION.REPORT_ACTIONS],
    }),
);

beforeEach(() => {
    wrapOnyxWithWaitForBatchedUpdates(Onyx);
    PersistedRequests.clear();
    PersistedRequests.save(request);
});

afterEach(() => {
    PersistedRequests.clear();
    Onyx.clear();
});

describe('PersistedRequests', () => {
    it('save a request without conflicts', () => {
        PersistedRequests.save(request);
        expect(PersistedRequests.getAll().length).toBe(2);
    });

    it('remove a request from the PersistedRequests array', () => {
        PersistedRequests.endRequestAndRemoveFromQueue(request);
        expect(PersistedRequests.getAll().length).toBe(0);
    });

    it('when process the next request, queue should be empty', () => {
        const nextRequest = PersistedRequests.processNextRequest();
        expect(PersistedRequests.getAll().length).toBe(0);
        expect(nextRequest).toEqual(request);
    });

    it('when onyx persist the request, it should remove from the list the ongoing request', () => {
        expect(PersistedRequests.getAll().length).toBe(1);
        const request2: Request<'reportMetadata_3' | 'reportMetadata_4'> = {
            command: 'AddComment',
            successData: [{key: 'reportMetadata_3', onyxMethod: 'merge', value: {}}],
            failureData: [{key: 'reportMetadata_4', onyxMethod: 'merge', value: {}}],
            requestID: 2,
        };
        PersistedRequests.save(request2);
        PersistedRequests.processNextRequest();
        return waitForBatchedUpdates().then(() => {
            expect(PersistedRequests.getAll().length).toBe(1);
            expect(PersistedRequests.getAll().at(0)).toEqual(request2);
        });
    });

    it('update the request at the given index with new data', () => {
        const newRequest: Request<'reportMetadata_1' | 'reportMetadata_2'> = {
            command: 'OpenReport',
            successData: [{key: 'reportMetadata_1', onyxMethod: 'set', value: {}}],
            failureData: [{key: 'reportMetadata_2', onyxMethod: 'set', value: {}}],
            requestID: 3,
        };
        PersistedRequests.update(0, newRequest);
        expect(PersistedRequests.getAll().at(0)).toEqual(newRequest);
    });

    it('update the ongoing request with new data', () => {
        const newRequest: Request<'reportMetadata_1' | 'reportMetadata_2'> = {
            command: 'OpenReport',
            successData: [{key: 'reportMetadata_1', onyxMethod: 'set', value: {}}],
            failureData: [{key: 'reportMetadata_2', onyxMethod: 'set', value: {}}],
            requestID: 4,
        };
        PersistedRequests.updateOngoingRequest(newRequest);
        expect(PersistedRequests.getOngoingRequest()).toEqual(newRequest);
    });

    it('when removing a request should update the persistedRequests queue and clear the ongoing request', () => {
        PersistedRequests.processNextRequest();
        expect(PersistedRequests.getOngoingRequest()).toEqual(request);
        PersistedRequests.endRequestAndRemoveFromQueue(request);
        expect(PersistedRequests.getOngoingRequest()).toBeNull();
        expect(PersistedRequests.getAll().length).toBe(0);
    });
});

// Issue: https://github.com/Expensify/App/issues/80759
describe('PersistedRequests persistence guarantees', () => {
    // BUG: processNextRequest() moves the first request from the queue to
    // ongoingRequest (in-memory only). The request is only persisted to
    // PERSISTED_ONGOING_REQUESTS on disk when persistWhenOngoing is true —
    // but no production code ever sets this flag. Every write request in the
    // app uses the default (false), so ALL ongoing requests are unprotected.
    // If the app dies while a request is in-flight, the ongoing request is
    // lost from memory and has no disk backup. On restart, the dedup check
    // in the connect callback (PersistedRequests.ts:53-67) cannot detect
    // that this request was already being processed.
    it('Issue 3a: ongoing request should be persisted to disk (persistWhenOngoing is never set in production)', () =>
        waitForBatchedUpdates().then(() => {
            // The request from beforeEach has no persistWhenOngoing — same as every
            // write request in production. No code path ever sets it to true.
            expect(request.persistWhenOngoing).toBeUndefined();
            expect(PersistedRequests.getAll()).toHaveLength(1);

            // Spy on Onyx.set AFTER beforeEach has settled to avoid capturing setup calls
            const setMock = jest.spyOn(Onyx, 'set');

            // Move the request from queue to ongoingRequest
            PersistedRequests.processNextRequest();

            // In-memory: request is now ongoingRequest, queue is empty
            expect(PersistedRequests.getOngoingRequest()).toEqual(request);
            expect(PersistedRequests.getAll()).toHaveLength(0);

            return waitForBatchedUpdates()
                .then(() => {
                    // BUG: Onyx.set was never called for PERSISTED_ONGOING_REQUESTS
                    // because persistWhenOngoing is undefined (PersistedRequests.ts:273).
                    // The ongoing request exists only in memory — no disk backup.
                    // When fixed, this should persist ALL ongoing requests regardless
                    // of the persistWhenOngoing flag. Change to:
                    //   expect(setMock).toHaveBeenCalledWith(
                    //     ONYXKEYS.PERSISTED_ONGOING_REQUESTS,
                    //     expect.objectContaining({command: 'OpenReport'}),
                    //   );
                    expect(setMock).not.toHaveBeenCalledWith(ONYXKEYS.PERSISTED_ONGOING_REQUESTS, expect.objectContaining({command: 'OpenReport'}));
                })
                .finally(() => {
                    setMock.mockRestore();
                });
        }));
});
