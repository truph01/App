import {beforeAll, beforeEach, describe, expect, it} from '@jest/globals';
import Onyx from 'react-native-onyx';
import {addLocalPasskeyCredential, deleteLocalPasskeyCredentials, getPasskeyOnyxKey, reconcileLocalPasskeysWithBackend} from '@libs/actions/Passkey';
import type {BackendPasskeyCredential} from '@libs/actions/Passkey';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {LocalPasskeyEntry, PasskeyCredential} from '@src/types/onyx';
import getOnyxValue from '../utils/getOnyxValue';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';

describe('actions/Passkey', () => {
    beforeAll(() => {
        Onyx.init({keys: ONYXKEYS});
    });

    beforeEach(() => {
        return Onyx.clear().then(waitForBatchedUpdates);
    });

    describe('getPasskeyOnyxKey', () => {
        it('should return correct key format', () => {
            const key = getPasskeyOnyxKey('123');

            expect(key).toBe(`${ONYXKEYS.COLLECTION.PASSKEYS}123`);
        });
    });

    describe('addLocalPasskeyCredential', () => {
        const userId = '123';
        const credential: PasskeyCredential = {id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]};

        it('should throw error when userId is empty', () => {
            expect(() => addLocalPasskeyCredential({userId: '', credential, existingEntry: null})).toThrow();
        });

        it('should create new entry when existingEntry is null', async () => {
            addLocalPasskeyCredential({userId, credential, existingEntry: null});
            await waitForBatchedUpdates();

            const value = await getOnyxValue(getPasskeyOnyxKey(userId));
            expect(value).toEqual({credentials: [credential]});
        });

        it('should add credential to existing entry', async () => {
            const existingEntry: LocalPasskeyEntry = {credentials: [{id: 'existing', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}]};

            addLocalPasskeyCredential({userId, credential, existingEntry});
            await waitForBatchedUpdates();

            const value = await getOnyxValue(getPasskeyOnyxKey(userId));
            expect(value).toEqual({credentials: [{id: 'existing', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}, credential]});
        });

        it('should throw error when credential with same id already exists', () => {
            const existingEntry: LocalPasskeyEntry = {credentials: [{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}]};

            expect(() => addLocalPasskeyCredential({userId, credential, existingEntry})).toThrow();
        });
    });

    describe('deleteLocalPasskeyCredentials', () => {
        const userId = '123';

        it('should throw error when userId is empty', () => {
            expect(() => deleteLocalPasskeyCredentials('')).toThrow();
        });

        it('should delete existing passkey entry from Onyx', async () => {
            const entry: LocalPasskeyEntry = {credentials: [{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}]};
            await Onyx.set(`${ONYXKEYS.COLLECTION.PASSKEYS}${userId}`, entry);
            await waitForBatchedUpdates();

            deleteLocalPasskeyCredentials(userId);
            await waitForBatchedUpdates();

            const value = await getOnyxValue(`${ONYXKEYS.COLLECTION.PASSKEYS}${userId}`);
            expect(value).toEqual({credentials: []});
        });

        it('should handle deletion of non-existent entry gracefully', async () => {
            deleteLocalPasskeyCredentials(userId);
            await waitForBatchedUpdates();

            const value = await getOnyxValue(`${ONYXKEYS.COLLECTION.PASSKEYS}${userId}`);
            expect(value).toEqual({credentials: []});
        });
    });

    describe('reconcileLocalPasskeysWithBackend', () => {
        const userId = '123';

        it('should throw error when userId is empty', () => {
            expect(() => reconcileLocalPasskeysWithBackend({userId: '', backendPasskeyCredentials: [], localEntry: null})).toThrow();
        });

        it('should return empty array when localEntry is null', () => {
            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials: [], localEntry: null});

            expect(result).toEqual([]);
        });

        it('should return empty array when localEntry has no credentials', () => {
            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials: [], localEntry: {credentials: []}});

            expect(result).toEqual([]);
        });

        it('should return all matched credentials when all exist on backend', () => {
            const localCredentials: PasskeyCredential[] = [
                {id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]},
                {id: 'cred-2', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.HYBRID]},
            ];
            const backendPasskeyCredentials: BackendPasskeyCredential[] = [
                {id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE},
                {id: 'cred-2', type: CONST.PASSKEY_CREDENTIAL_TYPE},
            ];

            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials, localEntry: {credentials: localCredentials}});

            expect(result).toEqual(localCredentials);
        });

        it('should remove local credentials not on backend and update Onyx', async () => {
            const localCredentials: PasskeyCredential[] = [
                {id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]},
                {id: 'cred-2', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.HYBRID]},
            ];
            const backendPasskeyCredentials: BackendPasskeyCredential[] = [{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE}];

            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials, localEntry: {credentials: localCredentials}});
            await waitForBatchedUpdates();

            expect(result).toEqual([{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}]);

            const value = await getOnyxValue(getPasskeyOnyxKey(userId));
            expect(value).toEqual({credentials: [{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}]});
        });

        it('should set empty credentials when no credentials match backend', async () => {
            const localCredentials: PasskeyCredential[] = [{id: 'old-cred', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL]}];
            const backendPasskeyCredentials: BackendPasskeyCredential[] = [{id: 'new-cred', type: CONST.PASSKEY_CREDENTIAL_TYPE}];

            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials, localEntry: {credentials: localCredentials}});
            await waitForBatchedUpdates();

            expect(result).toEqual([]);

            const value = await getOnyxValue(getPasskeyOnyxKey(userId));
            expect(value).toEqual({credentials: []});
        });

        it('should preserve transports from local credentials', () => {
            // Backend doesn't store transports, only local storage does
            const localCredentials: PasskeyCredential[] = [
                {id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE, transports: [CONST.PASSKEY_TRANSPORT.INTERNAL, CONST.PASSKEY_TRANSPORT.HYBRID]},
            ];
            const backendPasskeyCredentials: BackendPasskeyCredential[] = [{id: 'cred-1', type: CONST.PASSKEY_CREDENTIAL_TYPE}];

            const result = reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials, localEntry: {credentials: localCredentials}});

            expect(result).toEqual(localCredentials);
        });
    });
});
