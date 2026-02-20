import {act, renderHook} from '@testing-library/react-native';
import Onyx from 'react-native-onyx';
import useMappedPersonalDetails, {personalDetailMapper} from '@hooks/useMappedPersonalDetails';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PersonalDetails} from '@src/types/onyx';
import waitForBatchedUpdatesWithAct from '../utils/waitForBatchedUpdatesWithAct';

const ALICE_ACCOUNT_ID = 1;
const BOB_ACCOUNT_ID = 2;
const ALICE_KEY = String(ALICE_ACCOUNT_ID);
const BOB_KEY = String(BOB_ACCOUNT_ID);

const aliceDetails: PersonalDetails = {
    accountID: ALICE_ACCOUNT_ID,
    login: 'alice@example.com',
    avatar: 'https://example.com/alice.png',
    displayName: 'Alice',
    pronouns: 'she/her',
};

const bobDetails: PersonalDetails = {
    accountID: BOB_ACCOUNT_ID,
    login: 'bob@example.com',
    avatar: 'https://example.com/bob.png',
    displayName: 'Bob',
    pronouns: undefined,
};

const mockPersonalDetails = {
    [ALICE_KEY]: aliceDetails,
    [BOB_KEY]: bobDetails,
};

describe('useMappedPersonalDetails', () => {
    beforeEach(() => {
        Onyx.init({keys: ONYXKEYS});
    });

    afterEach(async () => {
        await act(async () => {
            await Onyx.clear();
        });
        await waitForBatchedUpdatesWithAct();
    });

    it('returns an empty object when personal details are not set', () => {
        const {result} = renderHook(() => useMappedPersonalDetails(personalDetailMapper));

        const [transformed] = result.current;
        expect(transformed).toEqual({});
    });

    it('maps personal details using the provided mapper', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, mockPersonalDetails);
        });

        const {result} = renderHook(() => useMappedPersonalDetails(personalDetailMapper));

        const [transformed] = result.current;
        expect(transformed[ALICE_KEY]).toEqual({
            accountID: ALICE_ACCOUNT_ID,
            login: 'alice@example.com',
            avatar: 'https://example.com/alice.png',
            pronouns: 'she/her',
        });
        expect(transformed[BOB_KEY]).toEqual({
            accountID: BOB_ACCOUNT_ID,
            login: 'bob@example.com',
            avatar: 'https://example.com/bob.png',
            pronouns: undefined,
        });
    });

    it('updates mapped details when Onyx data changes', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, {[ALICE_KEY]: aliceDetails});
        });

        const {result} = renderHook(() => useMappedPersonalDetails(personalDetailMapper));

        expect(Object.keys(result.current[0])).toHaveLength(1);

        await act(async () => {
            await Onyx.merge(ONYXKEYS.PERSONAL_DETAILS_LIST, {[BOB_KEY]: bobDetails});
        });

        await waitForBatchedUpdatesWithAct();

        expect(Object.keys(result.current[0])).toHaveLength(2);
        expect(result.current[0][BOB_KEY]).toEqual({
            accountID: BOB_ACCOUNT_ID,
            login: 'bob@example.com',
            avatar: 'https://example.com/bob.png',
            pronouns: undefined,
        });
    });

    it('applies a custom mapper to each personal detail entry', async () => {
        await act(async () => {
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, mockPersonalDetails);
        });

        const loginMapper = (detail: PersonalDetails | undefined) => detail?.login ?? '';
        const {result} = renderHook(() => useMappedPersonalDetails(loginMapper));

        const [transformed] = result.current;
        expect(transformed[ALICE_KEY]).toBe('alice@example.com');
        expect(transformed[BOB_KEY]).toBe('bob@example.com');
    });
});
