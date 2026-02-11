/**
 * Given the list of PRs associated with a commit on the target branch,
 * find the PR that was actually merged into that branch.
 *
 * The GitHub API `listPullRequestsAssociatedWithCommit` returns ALL PRs
 * that contain the commit — including open PRs that have merged the target
 * branch into their feature branch. We must filter to only merged PRs
 * targeting the correct base branch to avoid blaming the wrong PR.
 *
 * @param {Array} associatedPRs - PRs from the GitHub API
 * @param {string} targetBranch - The branch to filter by (default: 'main')
 * @returns {object|undefined} The merged PR, or the first PR as fallback
 */
function getMergedPR(associatedPRs, targetBranch = 'main') {
    return associatedPRs.find((pr) => pr.merged_at !== null && pr.base.ref === targetBranch) ?? associatedPRs.at(0);
}

module.exports = getMergedPR;
