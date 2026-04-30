/**
 * Rewrites `@typescript-eslint/no-deprecated` messages into per-API rule IDs
 * (e.g. `@typescript-eslint/no-deprecated/StyleSheet.absoluteFillObject`) so
 * eslint-seatbelt can ratchet each deprecated API independently.
 */
import {parse} from '@babel/parser';

const NO_DEPRECATED_RULE_ID = '@typescript-eslint/no-deprecated';
const sourceByFilename = new Map();

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
 * @param {string} source
 * @param {number} line
 * @param {number} column
 * @returns {number | null}
 */
function getIndexFromLocation(source, line, column) {
    const lineStarts = [0];
    for (let index = 0; index < source.length; index++) {
        if (source.at(index) === '\n') {
            lineStarts.push(index + 1);
        }
    }

    const lineStart = lineStarts.at(line - 1);
    if (lineStart === undefined) {
        return null;
    }

    return lineStart + column - 1;
}

/**
 * @param {unknown} value
 * @returns {value is {type: string; start: number; end: number}}
 */
function isAstNode(value) {
    return Boolean(value && typeof value === 'object' && typeof value.type === 'string' && typeof value.start === 'number' && typeof value.end === 'number');
}

/**
 * @param {unknown} node
 * @param {WeakMap<object, object>} parentByNode
 * @param {object | null} parent
 */
function collectParents(node, parentByNode, parent = null) {
    if (!isAstNode(node)) {
        return;
    }

    if (parent) {
        parentByNode.set(node, parent);
    }

    for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) {
            continue;
        }
        if (Array.isArray(value)) {
            value.forEach((child) => collectParents(child, parentByNode, node));
            continue;
        }
        collectParents(value, parentByNode, node);
    }
}

/**
 * @param {unknown} node
 * @param {number} index
 * @returns {object | null}
 */
function findSmallestNodeAtIndex(node, index) {
    if (!isAstNode(node) || index < node.start || index > node.end) {
        return null;
    }

    let smallest = node;
    for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) {
            continue;
        }
        const candidates = Array.isArray(value) ? value : [value];
        for (const child of candidates) {
            const childMatch = findSmallestNodeAtIndex(child, index);
            if (childMatch && childMatch.end - childMatch.start <= smallest.end - smallest.start) {
                smallest = childMatch;
            }
        }
    }

    return smallest;
}

/**
 * @param {object} node
 * @param {WeakMap<object, object>} parentByNode
 * @returns {object}
 */
function getTopMemberLikeNode(node, parentByNode) {
    let current = node;
    let parent = parentByNode.get(current);

    while (
        parent &&
        ((parent.type === 'MemberExpression' && (parent.property === current || parent.object === current)) ||
            (parent.type === 'OptionalMemberExpression' && (parent.property === current || parent.object === current)) ||
            (parent.type === 'TSQualifiedName' && (parent.left === current || parent.right === current)))
    ) {
        current = parent;
        parent = parentByNode.get(current);
    }

    return current;
}

/**
 * @param {string} source
 * @param {import('eslint').Linter.LintMessage} message
 * @returns {string | null}
 */
function extractApiNameFromSource(source, message) {
    const index = getIndexFromLocation(source, message.line, message.column);
    if (index === null) {
        return null;
    }

    try {
        const ast = parse(source, {sourceType: 'module', plugins: ['typescript', 'jsx']});
        const parentByNode = new WeakMap();
        collectParents(ast, parentByNode);
        const node = findSmallestNodeAtIndex(ast, index);
        if (!node) {
            return null;
        }

        const topMemberLikeNode = getTopMemberLikeNode(node, parentByNode);
        return source.slice(topMemberLikeNode.start, topMemberLikeNode.end);
    } catch {
        return null;
    }
}

/**
 * @param {import('eslint').Linter.LintMessage[]} messages
 * @param {string | null} source
 * @returns {import('eslint').Linter.LintMessage[]}
 */
function stratifyMessages(messages, source) {
    return messages.map((message) => {
        if (message.ruleId !== NO_DEPRECATED_RULE_ID) {
            return message;
        }
        const apiName = (source && extractApiNameFromSource(source, message)) || extractDeprecatedApiName(message);
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

    preprocess(text, filename) {
        sourceByFilename.set(filename, text);
        return [text];
    },

    postprocess(messagesPerBlock, filename) {
        const source = sourceByFilename.get(filename) ?? null;
        sourceByFilename.delete(filename);
        return stratifyMessages(messagesPerBlock[0], source);
    },
};

export default processor;
