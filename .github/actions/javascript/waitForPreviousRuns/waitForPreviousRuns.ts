import * as core from '@actions/core';
import CONST from '@github/libs/CONST';
import GithubUtils from '@github/libs/GithubUtils';

const POLL_RATE_SECONDS = CONST.POLL_RATE / 1000;

// Only check in_progress and queued — other statuses (waiting, requested, pending) were not
// observed in testing. Keeping this minimal to avoid unnecessary GitHub API requests.
const ACTIVE_STATUSES = [CONST.RUN_STATUS.IN_PROGRESS, CONST.RUN_STATUS.QUEUED] as const;

async function getOlderActiveRuns(workflowID: string, currentRunID: number) {
    const responses = await Promise.all(
        ACTIVE_STATUSES.map((status) =>
            GithubUtils.octokit.actions.listWorkflowRuns({
                owner: CONST.GITHUB_OWNER,
                repo: CONST.APP_REPO,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                workflow_id: workflowID,
                status,
            }),
        ),
    );

    const allRuns = responses.flatMap((r) => r.data.workflow_runs);
    return allRuns.filter((workflowRun) => workflowRun.id < currentRunID);
}

function run() {
    const workflowID = core.getInput('WORKFLOW_ID', {required: true});
    const currentRunID = Number(core.getInput('CURRENT_RUN_ID', {required: true}));

    core.info(`Current run ID: ${currentRunID}`);
    core.info(`Workflow ID: ${workflowID}`);
    core.info('Waiting for all earlier runs of this workflow to complete...');

    // GitHub API is eventually consistent — runs can briefly disappear from results
    // between status transitions, then reappear on the next poll with the same status. 
    // Multiple consecutive clean checks prevent premature release caused by these flickers.
    const requiredCleanChecks = 3;

    return new Promise<void>((resolve, reject) => {
        let intervalId: ReturnType<typeof setInterval>;
        let isChecking = false;
        let consecutiveCleanChecks = 0;

        const check = () => {
            if (isChecking) {
                return;
            }
            isChecking = true;

            getOlderActiveRuns(workflowID, currentRunID)
                .then((olderActiveRuns) => {
                    if (olderActiveRuns.length === 0) {
                        consecutiveCleanChecks++;

                        if (consecutiveCleanChecks >= requiredCleanChecks) {
                            core.info('No earlier runs in progress. Proceeding with build.');
                            clearInterval(intervalId);
                            resolve();
                            return;
                        }

                        core.info(`No earlier runs found (${consecutiveCleanChecks}/${requiredCleanChecks} clean checks). Confirming in ${POLL_RATE_SECONDS}s...`);
                        return;
                    }

                    consecutiveCleanChecks = 0;
                    const runIDs = olderActiveRuns.map((workflowRun) => `#${workflowRun.id} (${workflowRun.status})`).join(', ');
                    core.info(`Waiting for ${olderActiveRuns.length} earlier run(s): ${runIDs}. Polling again in ${POLL_RATE_SECONDS}s...`);
                })
                .catch((error: unknown) => {
                    clearInterval(intervalId);
                    reject(error);
                })
                .finally(() => {
                    isChecking = false;
                });
        };

        check();
        intervalId = setInterval(check, CONST.POLL_RATE);
    });
}

if (require.main === module) {
    run();
}

export default run;
