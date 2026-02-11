/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/naming-convention -- matching GitHub API response field names */

type PullRequest = {
    html_url: string;
    user: {login: string} | null;
    merged_at: string | null;
    base: {ref: string};
    number: number;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, import/no-relative-parent-imports -- .github/libs JS module outside src
const getMergedPR: (associatedPRs: PullRequest[], targetBranch?: string) => PullRequest | undefined = require('../../.github/libs/failureNotifierUtils');

describe('getMergedPR', () => {
    const mergedPR: PullRequest = {
        html_url: 'https://github.com/Expensify/App/pull/82016',
        user: {login: 'test-user'},
        merged_at: '2026-02-10T17:00:00Z',
        base: {ref: 'main'},
        number: 82016,
    };

    const openPRWithMainMerged: PullRequest = {
        html_url: 'https://github.com/Expensify/App/pull/80254',
        user: {login: 'test-user'},
        merged_at: null,
        base: {ref: 'main'},
        number: 80254,
    };

    const openPRDifferentBase: PullRequest = {
        html_url: 'https://github.com/Expensify/App/pull/99999',
        user: {login: 'other-user'},
        merged_at: null,
        base: {ref: 'staging'},
        number: 99999,
    };

    it('should return the merged PR, not an open PR that contains the same commit', () => {
        // When an open PR has merged main, both PRs are associated with the head commit.
        // The API may return the open PR first (this is the bug scenario).
        const associatedPRs = [openPRWithMainMerged, mergedPR];

        const result = getMergedPR(associatedPRs);

        // Should pick the actually-merged PR, not the open one
        expect(result?.number).toBe(82016);
        expect(result?.merged_at).not.toBeNull();
    });

    it('should return the merged PR even when it appears first', () => {
        const associatedPRs = [mergedPR, openPRWithMainMerged];

        const result = getMergedPR(associatedPRs);

        expect(result?.number).toBe(82016);
    });

    it('should filter by target branch', () => {
        const mergedToStaging: PullRequest = {
            ...mergedPR,
            number: 11111,
            base: {ref: 'staging'},
            merged_at: '2026-02-10T18:00:00Z',
        };

        const associatedPRs = [mergedToStaging, mergedPR];

        // Default target branch is 'main', so it should skip the staging PR
        const result = getMergedPR(associatedPRs);
        expect(result?.number).toBe(82016);
    });

    it('should fall back to first PR if no merged PR is found', () => {
        const associatedPRs = [openPRWithMainMerged, openPRDifferentBase];

        const result = getMergedPR(associatedPRs);

        // Falls back to first element when no merged PR matches
        expect(result?.number).toBe(80254);
    });

    it('should return undefined for empty array', () => {
        const result = getMergedPR([]);

        expect(result).toBeUndefined();
    });
});
