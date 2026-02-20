import {act, renderHook} from '@testing-library/react-native';
import Onyx from 'react-native-onyx';
import usePersonalDetailsByEmail from '@hooks/usePersonalDetailsByEmail';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PersonalDetails} from '@src/types/onyx';
import waitForBatchedUpdatesWithAct from '../utils/waitForBatchedUpdatesWithAct';

const ALICE_ACCOUNT_ID = 1;
const BOB_ACCOUNT_ID = 2;
const NO_EMAIL_ACCOUNT_ID = 3;
const ALICE_KEY = String(ALICE_ACCOUNT_ID);
const BOB_KEY = String(BOB_ACCOUNT_ID);
const NO_EMAIL_KEY = String(NO_EMAIL_ACCOUNT_ID);

const aliceDetails: PersonalDetails = {
    accountID: ALICE_ACCOUNT_ID,
    login: 'alice@example.com',
    displayName: 'Alice',
};

const bobDetails: PersonalDetails = {
    accountID: BOB_ACCOUNT_ID,
    login: 'bob@example.com',
    displayName: 'Bob',
};

const noEmailDetails: PersonalDetails = {
    accountID: NO_EMAIL_ACCOUNT_ID,
    login: undefined,
    displayName: 'No Email',
};

describe('usePersonalDetailsByEmail', () => {
    beforeEach(() => {
        Onyx.init({keys: ONYXKEYS});
    });

    afterEach(async () => {
        await act(async () => {
            await Onyx.clear();
        });
        await waitForBatchedUpdatesWithAct();
    });

    it('returns undefined when personal details are not set', () => {
        const {result} = renderHook(() => usePersonalDetailsByEmail());
        expect(result.current).toBeUndefined();
    });

    it('remaps personal details by login (email)', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, {[ALICE_KEY]: aliceDetails, [BOB_KEY]: bobDetails});
        });

        const {result} = renderHook(() => usePersonalDetailsByEmail());

        expect(result.current?.['alice@example.com']).toMatchObject({accountID: ALICE_ACCOUNT_ID, login: 'alice@example.com'});
        expect(result.current?.['bob@example.com']).toMatchObject({accountID: BOB_ACCOUNT_ID, login: 'bob@example.com'});
    });

    it('falls back to original key when login is undefined', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, {[NO_EMAIL_KEY]: noEmailDetails});
        });

        const {result} = renderHook(() => usePersonalDetailsByEmail());

        expect(result.current?.[NO_EMAIL_KEY]).toMatchObject({accountID: NO_EMAIL_ACCOUNT_ID, displayName: 'No Email'});
    });

    it('updates when personal details change in Onyx', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, {[ALICE_KEY]: aliceDetails});
        });

        const {result} = renderHook(() => usePersonalDetailsByEmail());
        expect(result.current?.['alice@example.com']).toBeDefined();
        expect(result.current?.['bob@example.com']).toBeUndefined();

        await act(async () => {
            await Onyx.merge(ONYXKEYS.PERSONAL_DETAILS_LIST, {[BOB_KEY]: bobDetails});
        });

        await waitForBatchedUpdatesWithAct();

        expect(result.current?.['bob@example.com']).toMatchObject({accountID: BOB_ACCOUNT_ID, login: 'bob@example.com'});
    });
});
