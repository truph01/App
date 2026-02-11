import Onyx from 'react-native-onyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {LocalPasskeyEntry, PasskeyCredential} from '@src/types/onyx';

/** Identifies a passkey storage scope for a specific user */
type PasskeyScope = {
    userId: string;
};

/** Returns Onyx key: passkey_${userId} */
function getPasskeyOnyxKey(userId: string): `${typeof ONYXKEYS.COLLECTION.PASSKEYS}${string}` {
    return `${ONYXKEYS.COLLECTION.PASSKEYS}${userId}`;
}

type SetLocalPasskeyCredentialsParams = PasskeyScope & {
    entry: LocalPasskeyEntry;
};

/**
 * Sets passkey credentials in Onyx storage.
 * We use Onyx.set() instead of Onyx.merge() because passkey entries contain an array of credentials
 * that needs to be fully replaced, not merged. Using merge() would append to the array instead of replacing it.
 */
function setLocalPasskeyCredentials({userId, entry}: SetLocalPasskeyCredentialsParams): void {
    if (!userId) {
        throw new Error('userId is required to store passkey credentials');
    }
    Onyx.set(getPasskeyOnyxKey(userId), entry);
}

type AddLocalPasskeyCredentialParams = PasskeyScope & {
    credential: PasskeyCredential;
    existingEntry: LocalPasskeyEntry | null;
};

function addLocalPasskeyCredential({userId, credential, existingEntry}: AddLocalPasskeyCredentialParams): void {
    const existingCredentials = existingEntry?.credentials ?? [];

    if (existingCredentials.some((c) => c.id === credential.id)) {
        throw new Error(`Passkey credential with id "${credential.id}" already exists for user ${userId}`);
    }

    setLocalPasskeyCredentials({userId, entry: {credentials: [...existingCredentials, credential]}});
}

/** Deletes all passkey credentials for a user from Onyx storage */
function deleteLocalPasskeyCredentials(userId: string): void {
    if (!userId) {
        throw new Error('userId is required to delete passkey credentials');
    }
    Onyx.set(getPasskeyOnyxKey(userId), {credentials: []});
}

/** Backend returns simplified format without transports */
type BackendPasskeyCredential = Omit<PasskeyCredential, 'transports'>;

type ReconcileLocalPasskeysWithBackendParams = PasskeyScope & {
    backendPasskeyCredentials: BackendPasskeyCredential[];
    localEntry: LocalPasskeyEntry | null;
};

/**
 * Reconciles local Onyx passkeys with backend allowCredentials.
 * Removes local credentials that no longer exist on backend.
 */
function reconcileLocalPasskeysWithBackend({userId, backendPasskeyCredentials, localEntry}: ReconcileLocalPasskeysWithBackendParams): PasskeyCredential[] {
    if (!userId) {
        throw new Error('userId is required to reconcile passkey credentials');
    }
    if (!localEntry || localEntry.credentials.length === 0) {
        return [];
    }

    const backendCredentialIds = new Set(backendPasskeyCredentials.map((c) => c.id));
    const matchedCredentials = localEntry.credentials.filter((c) => backendCredentialIds.has(c.id));

    if (matchedCredentials.length !== localEntry.credentials.length) {
        setLocalPasskeyCredentials({userId, entry: {credentials: matchedCredentials}});
    }

    return matchedCredentials;
}

export {getPasskeyOnyxKey, addLocalPasskeyCredential, deleteLocalPasskeyCredentials, reconcileLocalPasskeysWithBackend};
export type {BackendPasskeyCredential};
