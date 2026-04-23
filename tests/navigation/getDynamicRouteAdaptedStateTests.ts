import type {NavigationState, PartialState} from '@react-navigation/native';
import getDynamicRouteAdaptedState from '@libs/Navigation/helpers/dynamicRoutesUtils/getDynamicRouteAdaptedState';
import getStateFromPath from '@libs/Navigation/helpers/getStateFromPath';

jest.mock('@react-navigation/native', () => ({
    getStateFromPath: jest.fn(),
}));

jest.mock('@libs/Navigation/linkingConfig', () => ({
    linkingConfig: {
        config: {},
    },
}));

jest.mock('@libs/Navigation/linkingConfig/config', () => ({
    normalizedConfigs: {
        DynScreenA: {path: 'suffix-a'},
        DynScreenB: {path: 'suffix-b'},
        DynScreenC: {path: 'suffix-c'},
        DynMultiSeg: {path: 'deep/suffix-a'},
        DynCrossStack: {path: 'suffix-cross'},
        DynOptTrailing: {path: 'opt-page/:id?'},
        DynOptMiddle: {path: 'wrap/:p?/end'},
    },
    screensWithOnyxTabNavigator: new Set(),
}));

jest.mock('@src/ROUTES', () => ({
    DYNAMIC_ROUTES: {
        SUFFIX_A: {path: 'suffix-a', entryScreens: ['StaticScreen']},
        SUFFIX_B: {path: 'suffix-b', entryScreens: ['DynScreenA']},
        SUFFIX_C: {path: 'suffix-c', entryScreens: ['DynScreenB']},
        MULTI_SEG: {path: 'deep/suffix-a', entryScreens: ['StaticScreen']},
        SUFFIX_CROSS: {path: 'suffix-cross', entryScreens: ['DynScreenA']},
        OPT_TRAILING: {path: 'opt-page/:id?', entryScreens: ['StaticScreen']},
        OPT_MIDDLE: {path: 'wrap/:p?/end', entryScreens: ['StaticScreen']},
    },
}));

jest.mock('@libs/Log', () => ({
    warn: jest.fn(),
}));

jest.mock('@libs/Navigation/helpers/getMatchingNewRoute', () => jest.fn());
jest.mock('@libs/Navigation/helpers/dynamicRoutesUtils/getStateForDynamicRoute', () => jest.fn());
jest.mock('@libs/Navigation/helpers/getStateFromPath', () => jest.fn());

describe('getDynamicRouteAdaptedState', () => {
    const mockGetStateFromPath = getStateFromPath as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function makeRhpState(modalStackName: string, screenName: string, path?: string): PartialState<NavigationState> {
        return {
            routes: [
                {
                    name: 'RightModalNavigator',
                    state: {
                        routes: [
                            {
                                name: modalStackName,
                                state: {
                                    routes: [{name: screenName, path}],
                                    index: 0,
                                },
                            },
                        ],
                        index: 0,
                    },
                },
            ],
            index: 0,
        };
    }

    it('should add one screen behind for a single dynamic suffix', () => {
        const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
        const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

        mockGetStateFromPath.mockReturnValue(staticState);

        const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a');

        const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
        expect(innerRoutes).toHaveLength(2);
        expect(innerRoutes.at(0)?.name).toBe('StaticScreen');
        expect(innerRoutes.at(1)?.name).toBe('DynScreenA');
    });

    it('should build full chain for 3 dynamic suffixes', () => {
        const initialState = makeRhpState('ModalStack', 'DynScreenC', '/base/suffix-a/suffix-b/suffix-c');

        mockGetStateFromPath.mockImplementation((path: string) => {
            if (path === '/base/suffix-a/suffix-b') {
                return makeRhpState('ModalStack', 'DynScreenB', '/base/suffix-a/suffix-b');
            }
            if (path === '/base/suffix-a') {
                return makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
            }
            if (path === '/base') {
                return makeRhpState('ModalStack', 'StaticScreen', '/base');
            }
            return {routes: [{name: 'NotFound'}], index: 0};
        });

        const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/suffix-b/suffix-c');

        const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
        expect(innerRoutes).toHaveLength(4);
        expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA', 'DynScreenB', 'DynScreenC']);
    });

    it('should handle single dynamic suffix above a non-RHP base', () => {
        const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');

        const nonRhpState: PartialState<NavigationState> = {
            routes: [{name: 'FullscreenHome', path: '/base'}],
            index: 0,
        };
        mockGetStateFromPath.mockReturnValue(nonRhpState);

        const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a');

        const rootRoutes = result.routes;
        expect(rootRoutes).toHaveLength(2);
        expect(rootRoutes.at(0)?.name).toBe('FullscreenHome');
        expect(rootRoutes.at(1)?.name).toBe('RightModalNavigator');
    });

    it('should handle cross-modal-stack chain correctly', () => {
        const initialState = makeRhpState('ModalStackB', 'DynCrossStack', '/base/suffix-a/suffix-cross');

        mockGetStateFromPath.mockImplementation((path: string) => {
            if (path === '/base/suffix-a') {
                return makeRhpState('ModalStackA', 'DynScreenA', '/base/suffix-a');
            }
            if (path === '/base') {
                return makeRhpState('ModalStackA', 'StaticScreen', '/base');
            }
            return {routes: [{name: 'NotFound'}], index: 0};
        });

        const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/suffix-cross');

        const rhp = result.routes.at(0);
        const modalStacks = rhp?.state?.routes ?? [];

        expect(modalStacks).toHaveLength(2);
        expect(modalStacks.at(0)?.name).toBe('ModalStackA');
        expect(modalStacks.at(1)?.name).toBe('ModalStackB');

        const stackARoutes = modalStacks.at(0)?.state?.routes ?? [];
        expect(stackARoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA']);

        const stackBRoutes = modalStacks.at(1)?.state?.routes ?? [];
        expect(stackBRoutes.map((r) => r.name)).toEqual(['DynCrossStack']);
    });

    it('should handle multi-segment dynamic suffix', () => {
        const initialState = makeRhpState('ModalStack', 'DynMultiSeg', '/base/deep/suffix-a');
        const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

        mockGetStateFromPath.mockReturnValue(staticState);

        const result = getDynamicRouteAdaptedState(initialState, '/base/deep/suffix-a');

        const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
        expect(innerRoutes).toHaveLength(2);
        expect(innerRoutes.at(0)?.name).toBe('StaticScreen');
        expect(innerRoutes.at(1)?.name).toBe('DynMultiSeg');
    });

    it('should return state unchanged when suffix match fails', () => {
        const initialState = makeRhpState('ModalStack', 'DynScreenA', '/no-match-path');

        const result = getDynamicRouteAdaptedState(initialState, '/no-match-path');

        expect(result).toBe(initialState);
        expect(mockGetStateFromPath).not.toHaveBeenCalled();
    });

    it('should return state unchanged when getStateFromPath returns undefined for base path', () => {
        const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');

        mockGetStateFromPath.mockReturnValue(undefined);

        const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a');

        expect(result).toBe(initialState);
    });

    describe('layered stacking with optional path params', () => {
        it('strips a single trailing-optional suffix (present-form) and inserts the static base', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/opt-page/789');
            const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

            mockGetStateFromPath.mockReturnValue(staticState);

            const result = getDynamicRouteAdaptedState(initialState, '/base/opt-page/789');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptTrailing']);
            expect(mockGetStateFromPath).toHaveBeenCalledWith('/base');
        });

        it('strips a single trailing-optional suffix (absent-form) and inserts the static base', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/opt-page');
            const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

            mockGetStateFromPath.mockReturnValue(staticState);

            const result = getDynamicRouteAdaptedState(initialState, '/base/opt-page');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptTrailing']);
            expect(mockGetStateFromPath).toHaveBeenCalledWith('/base');
        });

        it('strips a single middle-optional suffix (present-form) and inserts the static base', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptMiddle', '/base/wrap/x/end');
            const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

            mockGetStateFromPath.mockReturnValue(staticState);

            const result = getDynamicRouteAdaptedState(initialState, '/base/wrap/x/end');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptMiddle']);
            expect(mockGetStateFromPath).toHaveBeenCalledWith('/base');
        });

        it('strips a single middle-optional suffix (absent-form) and inserts the static base', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptMiddle', '/base/wrap/end');
            const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base');

            mockGetStateFromPath.mockReturnValue(staticState);

            const result = getDynamicRouteAdaptedState(initialState, '/base/wrap/end');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptMiddle']);
            expect(mockGetStateFromPath).toHaveBeenCalledWith('/base');
        });

        it('stacks an inner trailing-optional (present) below an outer static suffix', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/suffix-a/opt-page/789');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/suffix-a') {
                    return makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/opt-page/789');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA', 'DynOptTrailing']);
        });

        it('stacks an inner trailing-optional (absent) below an outer static suffix', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/suffix-a/opt-page');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/suffix-a') {
                    return makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/opt-page');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA', 'DynOptTrailing']);
        });

        it('stacks an inner middle-optional (present) below an outer static suffix', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptMiddle', '/base/suffix-a/wrap/x/end');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/suffix-a') {
                    return makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/wrap/x/end');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA', 'DynOptMiddle']);
        });

        it('stacks an inner middle-optional (absent) below an outer static suffix', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptMiddle', '/base/suffix-a/wrap/end');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/suffix-a') {
                    return makeRhpState('ModalStack', 'DynScreenA', '/base/suffix-a');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/suffix-a/wrap/end');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynScreenA', 'DynOptMiddle']);
        });

        it('stacks an inner static suffix below an outer trailing-optional (present)', () => {
            const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/opt-page/789/suffix-a');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/opt-page/789') {
                    return makeRhpState('ModalStack', 'DynOptTrailing', '/base/opt-page/789');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/opt-page/789/suffix-a');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptTrailing', 'DynScreenA']);
        });

        it('stacks an inner multi-segment static below an outer trailing-optional (absent)', () => {
            // We use the multi-segment 'deep/suffix-a' as the inner static so the outer optional
            // 'opt-page/:id?' (max 2 segs) can NOT absorb the inner segments greedily.
            // (A 1-seg inner static would be ambiguous: 'opt-page/X' could match the optional's
            // present-form with id='X' instead of being interpreted as a layered URL.)
            const initialState = makeRhpState('ModalStack', 'DynMultiSeg', '/base/opt-page/deep/suffix-a');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/opt-page') {
                    return makeRhpState('ModalStack', 'DynOptTrailing', '/base/opt-page');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/opt-page/deep/suffix-a');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptTrailing', 'DynMultiSeg']);
        });

        it('stacks an inner static suffix below an outer middle-optional (present)', () => {
            const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/wrap/x/end/suffix-a');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/wrap/x/end') {
                    return makeRhpState('ModalStack', 'DynOptMiddle', '/base/wrap/x/end');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/wrap/x/end/suffix-a');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptMiddle', 'DynScreenA']);
        });

        it('stacks an inner static suffix below an outer middle-optional (absent)', () => {
            const initialState = makeRhpState('ModalStack', 'DynScreenA', '/base/wrap/end/suffix-a');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/wrap/end') {
                    return makeRhpState('ModalStack', 'DynOptMiddle', '/base/wrap/end');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/wrap/end/suffix-a');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptMiddle', 'DynScreenA']);
        });

        it('builds a 3-layer chain mixing trailing-optional → middle-optional → static', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/wrap/x/end/opt-page/789');

            mockGetStateFromPath.mockImplementation((path: string) => {
                if (path === '/base/wrap/x/end') {
                    return makeRhpState('ModalStack', 'DynOptMiddle', '/base/wrap/x/end');
                }
                if (path === '/base') {
                    return makeRhpState('ModalStack', 'StaticScreen', '/base');
                }
                return {routes: [{name: 'NotFound'}], index: 0};
            });

            const result = getDynamicRouteAdaptedState(initialState, '/base/wrap/x/end/opt-page/789');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptMiddle', 'DynOptTrailing']);
        });

        it('preserves query params across layered stripping with optional outer suffix', () => {
            const initialState = makeRhpState('ModalStack', 'DynOptTrailing', '/base/opt-page/789?tab=details');
            const staticState = makeRhpState('ModalStack', 'StaticScreen', '/base?tab=details');

            mockGetStateFromPath.mockReturnValue(staticState);

            const result = getDynamicRouteAdaptedState(initialState, '/base/opt-page/789?tab=details');

            const innerRoutes = result.routes.at(0)?.state?.routes.at(0)?.state?.routes ?? [];
            expect(innerRoutes.map((r) => r.name)).toEqual(['StaticScreen', 'DynOptTrailing']);
            expect(mockGetStateFromPath).toHaveBeenCalledWith('/base?tab=details');
        });
    });
});
