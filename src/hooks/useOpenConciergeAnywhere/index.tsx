import useSidePanelActions from '@hooks/useSidePanelActions';
import useSidePanelState from '@hooks/useSidePanelState';

/**
 * Returns a callback that opens the Concierge side panel on web.
 */
function useOpenConciergeAnywhere() {
    const {shouldHideSidePanel} = useSidePanelState();
    const {openSidePanel} = useSidePanelActions();

    return () => {
        if (!shouldHideSidePanel) {
            return;
        }
        openSidePanel();
    };
}

export default useOpenConciergeAnywhere;
