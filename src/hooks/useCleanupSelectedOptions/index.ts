import {NavigationContainerRefContext, useIsFocused} from '@react-navigation/native';
import {useContext, useEffect} from 'react';
import NAVIGATORS from '@src/NAVIGATORS';

let shouldCleanupSelectedOptions = false;

const useCleanupSelectedOptions = (setFunction: ({}: any) => void) => {
    const navigationContainerRef = useContext(NavigationContainerRefContext);
    const state = navigationContainerRef?.getState();
    const lastRoute = state.routes.at(-1);
    const isRightModalOpening = lastRoute?.name === NAVIGATORS.RIGHT_MODAL_NAVIGATOR;

    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused || isRightModalOpening) {
            return;
        }
        shouldCleanupSelectedOptions = false;
        setFunction?.({});
    }, [isFocused, setFunction, isRightModalOpening]);
};

export {useCleanupSelectedOptions};
