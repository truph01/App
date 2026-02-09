import Parser from '@libs/Parser';

export default function getClipboardPlainText(selection: string): string {
    return Parser.htmlToText(selection);
}
