import {getUnixTime, subDays, addDays} from 'date-fns';
import Onyx from 'react-native-onyx';
import {handleBulkPayItemSelected} from '@libs/actions/Search';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import Navigation from '@libs/Navigation/Navigation';
import createRandomPolicy from '../../utils/collections/policies';
import waitForBatchedUpdates from '../../utils/waitForBatchedUpdates';

jest.mock('@libs/Navigation/Navigation', () => ({
    navigate: jest.fn(),
    getActiveRoute: jest.fn().mockReturnValue('/'),
}));

jest.mock('@libs/PaymentUtils', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const actual = jest.requireActual('@libs/PaymentUtils');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
        ...actual,
        getActivePaymentType: jest.fn().mockReturnValue({
            paymentType: 'Elsewhere',
            policyFromPaymentMethod: undefined,
            policyFromContext: undefined,
            shouldSelectPaymentMethod: false,
        }),
    };
});

beforeAll(() => {
    Onyx.init({keys: ONYXKEYS});
});

const createValidItem = (key: string = CONST.IOU.PAYMENT_TYPE.ELSEWHERE) =>
    ({
        key,
        text: 'Pay elsewhere',
    }) as Parameters<typeof handleBulkPayItemSelected>[0]['item'];

const createDefaultParams = () => ({
    item: createValidItem(),
    triggerKYCFlow: jest.fn(),
    isAccountLocked: false,
    showLockedAccountModal: jest.fn(),
    policy: undefined,
    latestBankItems: undefined,
    activeAdminPolicies: [] as Parameters<typeof handleBulkPayItemSelected>[0]['activeAdminPolicies'],
    isUserValidated: true as boolean | undefined,
    isDelegateAccessRestricted: false,
    showDelegateNoAccessModal: jest.fn(),
    confirmPayment: jest.fn(),
});

describe('handleBulkPayItemSelected', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await Onyx.clear();
    });

    it('should return early for invalid bulk pay option', () => {
        const params = createDefaultParams();

        handleBulkPayItemSelected({
            ...params,
            item: createValidItem('invalid_key'),
        });

        expect(Navigation.navigate).not.toHaveBeenCalled();
        expect(params.showLockedAccountModal).not.toHaveBeenCalled();
        expect(params.showDelegateNoAccessModal).not.toHaveBeenCalled();
        expect(params.confirmPayment).not.toHaveBeenCalled();
    });

    it('should show delegate no access modal when delegate access is restricted', () => {
        const params = createDefaultParams();

        handleBulkPayItemSelected({
            ...params,
            isDelegateAccessRestricted: true,
        });

        expect(params.showDelegateNoAccessModal).toHaveBeenCalled();
        expect(Navigation.navigate).not.toHaveBeenCalled();
        expect(params.confirmPayment).not.toHaveBeenCalled();
    });

    it('should show locked account modal when account is locked', () => {
        const params = createDefaultParams();

        handleBulkPayItemSelected({
            ...params,
            isAccountLocked: true,
        });

        expect(params.showLockedAccountModal).toHaveBeenCalled();
        expect(Navigation.navigate).not.toHaveBeenCalled();
        expect(params.confirmPayment).not.toHaveBeenCalled();
    });

    it('should navigate to restricted action when billable actions are restricted with explicit ownerBillingGraceEndPeriod', async () => {
        const accountID = 1;
        const policyID = '1001';
        const policy = {
            ...createRandomPolicy(Number(policyID)),
            ownerAccountID: accountID,
        };

        await Onyx.multiSet({
            [ONYXKEYS.SESSION]: {email: 'test@test.com', accountID},
            [ONYXKEYS.NVP_PRIVATE_AMOUNT_OWED]: 5000,
            [`${ONYXKEYS.COLLECTION.POLICY}${policyID}` as const]: policy,
        });

        await waitForBatchedUpdates();

        handleBulkPayItemSelected({
            ...createDefaultParams(),
            policy,
            ownerBillingGraceEndPeriod: getUnixTime(subDays(new Date(), 3)),
        });

        expect(Navigation.navigate).toHaveBeenCalledWith(ROUTES.RESTRICTED_ACTION.getRoute(policy.id));
    });

    it('should NOT navigate to restricted action when ownerBillingGraceEndPeriod is not overdue', async () => {
        const accountID = 1;
        const policyID = '1001';
        const policy = {
            ...createRandomPolicy(Number(policyID)),
            ownerAccountID: accountID,
        };
        const confirmPayment = jest.fn();

        await Onyx.multiSet({
            [ONYXKEYS.SESSION]: {email: 'test@test.com', accountID},
            [ONYXKEYS.NVP_PRIVATE_AMOUNT_OWED]: 5000,
            [`${ONYXKEYS.COLLECTION.POLICY}${policyID}` as const]: policy,
        });

        await waitForBatchedUpdates();

        handleBulkPayItemSelected({
            ...createDefaultParams(),
            policy,
            confirmPayment,
            ownerBillingGraceEndPeriod: getUnixTime(addDays(new Date(), 3)),
        });

        expect(Navigation.navigate).not.toHaveBeenCalledWith(ROUTES.RESTRICTED_ACTION.getRoute(policy.id));
        expect(confirmPayment).toHaveBeenCalled();
    });

    it('should call confirmPayment when all checks pass', () => {
        const confirmPayment = jest.fn();

        handleBulkPayItemSelected({
            ...createDefaultParams(),
            confirmPayment,
        });

        expect(confirmPayment).toHaveBeenCalledWith(CONST.IOU.PAYMENT_TYPE.ELSEWHERE, undefined);
        expect(Navigation.navigate).not.toHaveBeenCalled();
    });
});
