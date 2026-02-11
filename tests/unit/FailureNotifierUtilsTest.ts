/**
 * @jest-environment node
 */
import getMergedPR from '@github/libs/failureNotifierUtils';
import type {PullRequest} from '@github/libs/failureNotifierUtils';

describe('getMergedPR', () => {
    const mergedPR: PullRequest = {
        htmlUrl: 'https://github.com/Expensify/App/pull/82016',
        user: {login: 'test-user'},
        mergedAt: '2026-02-10T17:00:00Z',
        baseRef: 'main',
        number: 82016,
    };

    const openPRWithMainMerged: PullRequest = {
        htmlUrl: 'https://github.com/Expensify/App/pull/80254',
        user: {login: 'test-user'},
        mergedAt: null,
        baseRef: 'main',
        number: 80254,
    };

    const openPRDifferentBase: PullRequest = {
        htmlUrl: 'https://github.com/Expensify/App/pull/99999',
        user: {login: 'other-user'},
        mergedAt: null,
        baseRef: 'staging',
        number: 99999,
    };

    it('should return the merged PR, not an open PR that contains the same commit', () => {
        // When an open PR has merged main, both PRs are associated with the head commit.
        // The API may return the open PR first (this is the bug scenario).
        const associatedPRs = [openPRWithMainMerged, mergedPR];

        const result = getMergedPR(associatedPRs);

        // Should pick the actually-merged PR, not the open one
        expect(result?.number).toBe(82016);
        expect(result?.mergedAt).not.toBeNull();
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
            baseRef: 'staging',
            mergedAt: '2026-02-10T18:00:00Z',
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
