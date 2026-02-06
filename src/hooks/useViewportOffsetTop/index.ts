import {useCallback, useEffect, useState} from 'react';
import addViewportResizeListener from '@libs/VisualViewport';

/**
 * A hook that returns the offset of the top edge of the visual viewport
 */
export default function useViewportOffsetTop(): number {
    const [viewportOffsetTop, setViewportOffsetTop] = useState(0);

    const updateOffsetTop = useCallback((event?: Event) => {
        let targetOffsetTop = window.visualViewport?.offsetTop ?? 0;
        if (event?.target instanceof VisualViewport) {
            targetOffsetTop = event.target.offsetTop;
        }

        setViewportOffsetTop(targetOffsetTop);
    }, []);

    useEffect(() => {
        const unsubscribe = addViewportResizeListener(updateOffsetTop);
        window.visualViewport?.addEventListener('scroll', updateOffsetTop);
        return () => {
            window.visualViewport?.removeEventListener('scroll', updateOffsetTop);
            unsubscribe();
        };
    }, [updateOffsetTop]);

    return viewportOffsetTop;
}
