/**
 * Rewrites `@typescript-eslint/no-deprecated` messages into per-API rule IDs
 * (e.g. `@typescript-eslint/no-deprecated/forwardRef`) so eslint-seatbelt can
 * ratchet each deprecated API independently. Visible messages are unchanged.
 */

const NO_DEPRECATED_RULE_ID = '@typescript-eslint/no-deprecated';

/**
 * Extracts the backtick-quoted API name from a no-deprecated message.
 * Message shapes: `` `name` is deprecated. `` / `` `name` is deprecated. reason ``
 *
 * @param {import('eslint').Linter.LintMessage} message
 * @returns {string | null}
 */
function extractDeprecatedApiName(message) {
    const match = /^`([^`]+)`/.exec(message.message);
    return match ? match[1] : null;
}

/**
 * Converts an API name to a stable rule ID suffix (trims; collapses whitespace
 * and `/` to `_`; preserves `.`, `#`, `$`, `@`).
 *
 * @param {string} apiName
 * @returns {string}
 */
function toRuleIdSuffix(apiName) {
    return apiName.trim().replaceAll(/[\s/]+/g, '_');
}

/**
 * @param {import('eslint').Linter.LintMessage[]} messages
 * @returns {import('eslint').Linter.LintMessage[]}
 */
function stratifyMessages(messages) {
    return messages.map((message) => {
        if (message.ruleId !== NO_DEPRECATED_RULE_ID) {
            return message;
        }
        const apiName = extractDeprecatedApiName(message);
        if (!apiName) {
            return message;
        }
        return {...message, ruleId: `${NO_DEPRECATED_RULE_ID}/${toRuleIdSuffix(apiName)}`};
    });
}

const processor = {
    meta: {
        name: 'stratify-no-deprecated',
        version: '1.0.0',
    },
    supportsAutofix: true,

    preprocess(text) {
        return [text];
    },

    postprocess(messagesPerBlock) {
        return stratifyMessages(messagesPerBlock[0]);
    },
};

export default processor;
