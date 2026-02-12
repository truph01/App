import * as core from '@actions/core';
import CONST from '@github/libs/CONST';
import GithubUtils from '@github/libs/GithubUtils';

const POLL_RATE_SECONDS = CONST.POLL_RATE / 1000;
const QUEUE_LIMIT = 20;
const MAX_API_RETRIES = 2;
const ACTIVE_STATUSES = new Set(['in_progress', 'queued', 'waiting', 'requested', 'pending']);

async function getOlderActiveRuns(workflowID: string, currentRunID: number) {
    const response = await GithubUtils.octokit.actions.listWorkflowRuns({
        owner: CONST.GITHUB_OWNER,
        repo: CONST.APP_REPO,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        workflow_id: workflowID,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        per_page: QUEUE_LIMIT,
    });

    return response.data.workflow_runs.filter((workflowRun) => workflowRun.id < currentRunID && ACTIVE_STATUSES.has(workflowRun.status));
}

function run() {
    const workflowID = core.getInput('WORKFLOW_ID', {required: true});
    const currentRunID = Number(core.getInput('CURRENT_RUN_ID', {required: true}));

    core.info(`Current run ID: ${currentRunID}`);
    core.info(`Workflow ID: ${workflowID}`);
    core.info('Waiting for all earlier runs of this workflow to complete...');

    return new Promise<void>((resolve, reject) => {
        let intervalId: ReturnType<typeof setInterval>;
        let isChecking = false;
        let consecutiveErrors = 0;
        let pollCount = 0;
        let maxQueueDepth = 0;

        const check = () => {
            if (isChecking) {
                return;
            }
            isChecking = true;
            pollCount++;

            getOlderActiveRuns(workflowID, currentRunID)
                .then((olderActiveRuns) => {
                    consecutiveErrors = 0;
                    maxQueueDepth = Math.max(maxQueueDepth, olderActiveRuns.length);

                    if (olderActiveRuns.length === 0) {
                        core.notice(`Queue summary: maxRunsAhead=${maxQueueDepth}, iterations=${pollCount}, waitTime=${(pollCount - 1) * POLL_RATE_SECONDS}s`);
                        core.info('No earlier runs in progress. Proceeding with build.');
                        clearInterval(intervalId);
                        resolve();
                        return;
                    }

                    const runIDs = olderActiveRuns.map((workflowRun) => `#${workflowRun.id} (${workflowRun.status})`).join(', ');
                    core.info(`Waiting for ${olderActiveRuns.length} earlier run(s): ${runIDs}. Polling again in ${POLL_RATE_SECONDS}s...`);
                })
                .catch((error: unknown) => {
                    consecutiveErrors++;
                    if (consecutiveErrors > MAX_API_RETRIES) {
                        core.error(`API failed ${consecutiveErrors} times in a row. Giving up.`);
                        clearInterval(intervalId);
                        reject(error);
                        return;
                    }
                    core.warning(`API error (attempt ${consecutiveErrors}/${MAX_API_RETRIES}). Retrying next poll...`);
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
