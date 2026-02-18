import {trimLeadingSpace} from '@libs/SuggestionUtils';
import CONST from '@src/CONST';

type NormalizedMentionPrefix = {
    mentionPrefix: string;
    normalizedPrefix: string;
};

type UpdatedCommentWithInsertedMentionParams = {
    value: string;
    atSignIndex: number;
    mentionPrefix: string;
    prefixType: string;
    mentionCode: string;
    whiteSpacesLength?: number;
};

function getOriginalMentionText(inputValue: string, atSignIndex: number, whiteSpacesLength = 0) {
    const rest = inputValue.slice(atSignIndex);

    if (whiteSpacesLength) {
        const str = rest.split(' ', whiteSpacesLength + 1).join(' ');
        return rest.slice(0, str.length);
    }

    const breakerIndex = rest.search(CONST.REGEX.MENTION_BREAKER);
    return breakerIndex === -1 ? rest : rest.slice(0, breakerIndex);
}

function getNormalizedMentionPrefix(prefixType: string, prefix: string): NormalizedMentionPrefix {
    const hasTrailingDot = prefixType === '@' && prefix.length > 1 && prefix.endsWith('.');

    return {
        mentionPrefix: prefix,
        normalizedPrefix: hasTrailingDot ? prefix.slice(0, -1) : prefix,
    };
}

function getUpdatedCommentWithInsertedMention({value, atSignIndex, mentionPrefix, prefixType, mentionCode, whiteSpacesLength = 0}: UpdatedCommentWithInsertedMentionParams): string {
    const commentBeforeAtSign = value.slice(0, atSignIndex);
    const originalMention = getOriginalMentionText(value, atSignIndex, whiteSpacesLength);

    let trailingDot = '';
    let mentionToReplace = originalMention;
    if (prefixType === '@' && mentionPrefix.endsWith('.')) {
        trailingDot = originalMention.match(CONST.REGEX.TRAILING_DOTS)?.[0] ?? '';
        mentionToReplace = originalMention.slice(0, originalMention.length - trailingDot.length);
    }

    const commentAfterMention = value.slice(atSignIndex + Math.max(mentionToReplace.length, mentionPrefix.length + prefixType.length));

    return `${commentBeforeAtSign}${mentionCode}${trailingDot}${trimLeadingSpace(commentAfterMention)}`;
}

export {getNormalizedMentionPrefix, getUpdatedCommentWithInsertedMention};
