import {Str} from 'expensify-common';
import Onyx from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Account} from '@src/types/onyx';
import Log from '@libs/Log';
import {init, sendEvent, setAttribute, setAuthenticationData} from './GroupIBSdkBridge';

let sessionID = Str.guid();
Log.info(`[Fraud Protection] Initial sessionID generated: ${sessionID}`);
let cachedAccount: OnyxEntry<Account>;

// Cache account data as it arrives before the session is fully authenticated.
Onyx.connectWithoutView({
    key: ONYXKEYS.ACCOUNT,
    callback: (account) => {
        cachedAccount = account;
    },
});

// When the session changes, send identity, sessionID and account attributes to the Fraud Protection server.
Onyx.connectWithoutView({
    key: ONYXKEYS.SESSION,
    callback: (session) => {
        const isAuthenticated = !!(session?.authToken ?? null);
        const identity = isAuthenticated ? (session?.accountID?.toString() ?? '') : '';

        Log.info(`[Fraud Protection] SESSION changed — isAuthenticated: ${isAuthenticated}, identity: ${identity}, sessionID: ${sessionID}, email: ${cachedAccount?.primaryLogin ?? ''}`);

        setAuthenticationData(identity, sessionID);
        setAttribute('email', cachedAccount?.primaryLogin ?? '', false, true);
        setAttribute('mfa', cachedAccount?.requiresTwoFactorAuth ? '2fa_enabled' : '2fa_disabled', false, true);
        setAttribute('is_validated', cachedAccount?.validated ? 'true' : 'false', false, true);

        // Generate a new sessionID for the next session after logout.
        if (!isAuthenticated) {
            sessionID = Str.guid();
            Log.info(`[Fraud Protection] Logged out — new sessionID generated for next session: ${sessionID}`);
        }
    },
});

export default {init, sendEvent, setAttribute};
