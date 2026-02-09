import {useEffect} from 'react';
import Clipboard from '@libs/Clipboard';
import getClipboardPlainText from '@libs/Clipboard/getClipboardPlainText';
import KeyboardShortcut from '@libs/KeyboardShortcut';
import SelectionScraper from '@libs/SelectionScraper';
import CONST from '@src/CONST';

function copySelectionToClipboard() {
    const selection = SelectionScraper.getCurrentSelection();
    if (!selection) {
        return;
    }
    const plainText = getClipboardPlainText(selection);
    if (!Clipboard.canSetHtml()) {
        Clipboard.setString(plainText);
        return;
    }
    Clipboard.setHtml(selection, plainText);
}

export default function useCopySelectionHelper() {
    useEffect(() => {
        const copyShortcutConfig = CONST.KEYBOARD_SHORTCUTS.COPY;
        const unsubscribeCopyShortcut = KeyboardShortcut.subscribe(
            copyShortcutConfig.shortcutKey,
            copySelectionToClipboard,
            copyShortcutConfig.descriptionKey,
            [...copyShortcutConfig.modifiers],
            false,
        );

        return () => {
            unsubscribeCopyShortcut();
        };
    }, []);
}
