type PullRequest = {
    html_url: string;
    user: {login: string} | null;
    merged_at: string | null;
    base: {ref: string};
    number: number;
};

/**
 * Given the list of PRs associated with a commit on the target branch,
 * find the PR that was actually merged into that branch.
 *
 * The GitHub API `listPullRequestsAssociatedWithCommit` returns ALL PRs
 * that contain the commit — including open PRs that have merged the target
 * branch into their feature branch. We must filter to only merged PRs
 * targeting the correct base branch to avoid blaming the wrong PR.
 */
function getMergedPR(associatedPRs: PullRequest[], targetBranch = 'main'): PullRequest | undefined {
    return associatedPRs.find((pr) => pr.merged_at !== null && pr.base.ref === targetBranch) ?? associatedPRs.at(0);
}

export default getMergedPR;
export type {PullRequest};
