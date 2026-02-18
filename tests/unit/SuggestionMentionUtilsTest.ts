import {getNormalizedMentionPrefix, getUpdatedCommentWithInsertedMention} from '@pages/inbox/report/ReportActionCompose/SuggestionMentionUtils';

describe('SuggestionMentionUtils', () => {
    describe('getNormalizedMentionPrefix', () => {
        it('keeps mention prefix for highlighting and normalizes trailing dot for @mentions', () => {
            expect(getNormalizedMentionPrefix('@', 'a.')).toEqual({
                mentionPrefix: 'a.',
                normalizedPrefix: 'a',
            });
        });

        it('does not normalize room mention prefixes', () => {
            expect(getNormalizedMentionPrefix('#', 'room.')).toEqual({
                mentionPrefix: 'room.',
                normalizedPrefix: 'room.',
            });
        });
    });

    describe('getUpdatedCommentWithInsertedMention', () => {
        it('preserves sentence punctuation when replacing a mention ending with dot', () => {
            const value = 'hello @a.';

            expect(
                getUpdatedCommentWithInsertedMention({
                    value,
                    atSignIndex: value.indexOf('@'),
                    mentionPrefix: 'a.',
                    prefixType: '@',
                    mentionCode: '@adam',
                }),
            ).toBe('hello @adam.');
        });

        it('does not add extra dots when replacing mention ending with multiple dots', () => {
            const value = 'hello @a..';

            expect(
                getUpdatedCommentWithInsertedMention({
                    value,
                    atSignIndex: value.indexOf('@'),
                    mentionPrefix: 'a..',
                    prefixType: '@',
                    mentionCode: '@adam',
                }),
            ).toBe('hello @adam.');
        });
    });
});
