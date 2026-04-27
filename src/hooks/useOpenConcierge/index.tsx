import useSidePanelActions from '@hooks/useSidePanelActions';
import useSidePanelState from '@hooks/useSidePanelState';

function useOpenConcierge() {
    const {shouldHideSidePanel: isSidePanelOpen} = useSidePanelState();
    const {openSidePanel} = useSidePanelActions();

    return () => {
        if (isSidePanelOpen) {
            return;
        }
        openSidePanel();
    };
}

export default useOpenConcierge;
