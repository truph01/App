import Log from '@libs/Log';
import validateDynamicRoutes from '@libs/Navigation/helpers/dynamicRoutesUtils/validateDynamicRoutes';

jest.mock('@libs/Log', () => ({
    __esModule: true,
    default: {
        alert: jest.fn(),
        info: jest.fn(),
        hmmm: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('validateDynamicRoutes', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        jest.clearAllMocks();
    });

    describe('non-conflicting registrations', () => {
        it('passes for two distinct static routes', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'verify-account'},
                    B: {path: 'add-bank-account/verify-account'},
                }),
            ).not.toThrow();
        });

        it('passes for static + parametric without overlap', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'verify-account'},
                    B: {path: 'flag/:reportID'},
                }),
            ).not.toThrow();
        });

        it('passes for two parametric routes with different prefixes', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'flag/:reportID/:actionID?'},
                    B: {path: 'star/:reportID/:actionID?'},
                }),
            ).not.toThrow();
        });

        it('passes for required-only patterns with different segment counts', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'flag/:id'},
                    B: {path: 'flag/:id/:actionID'},
                }),
            ).not.toThrow();
        });
    });

    describe('shadow conflicts in dev mode (throw)', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('throws when a trailing-optional absent-form shadows a static route', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'a/:p?'},
                    B: {path: 'a'},
                }),
            ).toThrow();
        });

        it('throws when a trailing-optional present-form shadows a parametric of same shape', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'a/:p?'},
                    B: {path: 'a/:q'},
                }),
            ).toThrow();
        });

        it('throws when middle-optional absent-form shadows another static route', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'c/:p?/d'},
                    B: {path: 'c/d'},
                }),
            ).toThrow();
        });

        it('throws when two parametric routes share the same shape', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: ':a/:b'},
                    B: {path: ':c/:d'},
                }),
            ).toThrow();
        });

        it('throws when a middle-optional present-form shadows another parametric', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'c/:p?/d'},
                    B: {path: 'c/:x/d'},
                }),
            ).toThrow();
        });

        it('error message includes both conflicting route keys', () => {
            try {
                validateDynamicRoutes({
                    FOO: {path: 'a/:p?'},
                    BAR: {path: 'a'},
                });
                throw new Error('expected validateDynamicRoutes to throw');
            } catch (e) {
                const message = (e as Error).message;
                expect(message).toContain('FOO');
                expect(message).toContain('BAR');
            }
        });

        it('throws on a 3-route registration with a buried conflict', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'static'},
                    B: {path: 'flag/:id'},
                    C: {path: 'flag/:other'},
                }),
            ).toThrow();
        });
    });

    describe('production mode (warn-only via Log.alert)', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('does not throw when a conflict is present', () => {
            expect(() =>
                validateDynamicRoutes({
                    A: {path: 'a/:p?'},
                    B: {path: 'a'},
                }),
            ).not.toThrow();
        });

        it('calls Log.alert when a conflict is present', () => {
            validateDynamicRoutes({
                A: {path: 'a/:p?'},
                B: {path: 'a'},
            });
            expect(Log.alert).toHaveBeenCalled();
        });

        it('does not call Log.alert when there is no conflict', () => {
            validateDynamicRoutes({
                A: {path: 'a'},
                B: {path: 'b'},
            });
            expect(Log.alert).not.toHaveBeenCalled();
        });
    });
});
