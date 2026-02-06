import {useCallback, useEffect} from 'react';
import useDebouncedState from '@hooks/useDebouncedState';
import useSidePanel from '@hooks/useSidePanel';
import CONST from '@src/CONST';

/**
 * Detects input or text area focus on browsers, to avoid scrolling on virtual viewports
 */
export default function useTackInputFocus(enable = false): boolean {
    const [, isInputFocusDebounced, setIsInputFocus] = useDebouncedState(false);
    const {shouldHideSidePanel} = useSidePanel();

    const handleFocusIn = useCallback(
        (event: FocusEvent) => {
            const targetElement = event.target as HTMLElement;
            if (targetElement.tagName === CONST.ELEMENT_NAME.INPUT || targetElement.tagName === CONST.ELEMENT_NAME.TEXTAREA) {
                setIsInputFocus(true);
            }
        },
        [setIsInputFocus],
    );

    const handleFocusOut = useCallback(
        (event: FocusEvent) => {
            const targetElement = event.target as HTMLElement;
            if (targetElement.tagName === CONST.ELEMENT_NAME.INPUT || targetElement.tagName === CONST.ELEMENT_NAME.TEXTAREA) {
                setIsInputFocus(false);
            }
        },
        [setIsInputFocus],
    );

    useEffect(() => {
        if (!enable || !shouldHideSidePanel) {
            return;
        }
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);
        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, [enable, handleFocusIn, handleFocusOut, shouldHideSidePanel]);

    return isInputFocusDebounced;
}
