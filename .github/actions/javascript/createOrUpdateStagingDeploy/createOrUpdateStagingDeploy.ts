import * as core from '@actions/core';
import run from '@scripts/createOrUpdateStagingDeploy';

async function main() {
    try {
        const token = core.getInput('GITHUB_TOKEN', {required: true});
        process.env.GITHUB_TOKEN = token;
        await run();
    } catch (e) {
        if (e instanceof Error) {
            core.setFailed(e);
            return;
        }
        core.setFailed('An unknown error occurred.');
    }
}

if (require.main === module) {
    main();
}

export default run;
