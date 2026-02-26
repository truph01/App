import LoadingBar from '@components/LoadingBar';
import useLoadingBarVisibility from '@hooks/useLoadingBarVisibility';
import useResponsiveLayout from '@hooks/useResponsiveLayout';

function HeaderLoadingBar() {
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const shouldShowLoadingBar = useLoadingBarVisibility();

    return <LoadingBar shouldShow={shouldShowLoadingBar && shouldUseNarrowLayout} />;
}

export default HeaderLoadingBar;
