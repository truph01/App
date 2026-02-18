import {Str} from 'expensify-common';
import React, {useCallback, useContext, useMemo, useState} from 'react';
import useOnyx from '@hooks/useOnyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type ChildrenProps from '@src/types/utils/ChildrenProps';

type LoginStateContextType = {
    login: string;
};

type LoginActionsContextType = {
    setLogin: (login: string) => void;
};

const LoginStateContext = React.createContext<LoginStateContextType>({
    login: '',
});

const LoginActionsContext = React.createContext<LoginActionsContextType>({
    setLogin: () => {},
});

function LoginProvider({children}: ChildrenProps) {
    const [credentials] = useOnyx(ONYXKEYS.CREDENTIALS, {canBeMissing: true});
    const [login, setLoginState] = useState(() => Str.removeSMSDomain(credentials?.login ?? ''));

    const setLogin = useCallback((newLogin: string) => {
        setLoginState(newLogin);
    }, []);

    const stateValue = useMemo<LoginStateContextType>(() => ({login}), [login]);
    const actionsValue = useMemo<LoginActionsContextType>(() => ({setLogin}), [setLogin]);

    return (
        <LoginStateContext.Provider value={stateValue}>
            <LoginActionsContext.Provider value={actionsValue}>{children}</LoginActionsContext.Provider>
        </LoginStateContext.Provider>
    );
}

function useLoginState() {
    return useContext(LoginStateContext);
}

function useLoginActions() {
    return useContext(LoginActionsContext);
}

export {LoginProvider, LoginStateContext, LoginActionsContext, useLoginState, useLoginActions};
export type {LoginStateContextType, LoginActionsContextType};
