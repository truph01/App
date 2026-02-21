import type {ReactNode} from 'react';
import {useEffect, useRef} from 'react';
import {AccessibilityInfo} from 'react-native';

function useFormHelpMessageAccessibilityAnnouncement(message: string | ReactNode, shouldAnnounceError: boolean) {
    const previousAnnouncedMessageRef = useRef('');

    useEffect(() => {
        if (!shouldAnnounceError || typeof message !== 'string' || !message.trim()) {
            return;
        }

        if (previousAnnouncedMessageRef.current === message) {
            return;
        }

        previousAnnouncedMessageRef.current = message;
        AccessibilityInfo.announceForAccessibility(message);
    }, [message, shouldAnnounceError]);
}

export default useFormHelpMessageAccessibilityAnnouncement;
