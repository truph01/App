#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/naming-convention */
import * as core from '@actions/core';
import {format} from 'date-fns/format';
import fs from 'fs';
import CONST from '@github/libs/CONST';
import GithubUtils from '@github/libs/GithubUtils';
import GitUtils from '@github/libs/GitUtils';
import type {MergedPR, SubmoduleUpdate} from '@github/libs/GitUtils';
import {generateStagingDeployCashBodyAndAssignees, getStagingDeployCashData} from '@github/libs/StagingDeployUtils';
import type {ChecklistItem, StagingDeployCashData} from '@github/libs/StagingDeployUtils';

type IssuesCreateResponse = Awaited<ReturnType<typeof GithubUtils.octokit.issues.create>>['data'];

type PackageJson = {
    version: string;
};

type TimelineEntry = {type: 'pr'; prNumber: number; date: string} | {type: 'submodule'; version: string; date: string; commit: string};

/**
 * Preserve the checked state from a previous checklist when building a new one.
 */
function preserveCheckboxState(items: Array<{number: number; url: string}>, currentList: ChecklistItem[] | undefined): ChecklistItem[] {
    return items.map((item) => {
        const existing = currentList?.find((c) => c.number === item.number);
        return {...item, isChecked: existing?.isChecked ?? false};
    });
}

async function buildChronologicalSection({
    chronologicalPREntries,
    submoduleUpdates,
    mergedMobileExpensifyPREntries,
}: {
    chronologicalPREntries: MergedPR[];
    submoduleUpdates: SubmoduleUpdate[];
    mergedMobileExpensifyPREntries: MergedPR[];
}): Promise<string> {
    if (chronologicalPREntries.length === 0 && submoduleUpdates.length === 0 && mergedMobileExpensifyPREntries.length === 0) {
        return '';
    }

    const submoduleRunURLs = new Map<string, string | undefined>();
    const results = await Promise.allSettled(
        submoduleUpdates.map(async (update) => {
            const runURL = await GithubUtils.getWorkflowRunURLForCommit(update.commit, 'testBuildOnPush.yml');
            return {commit: update.commit, runURL};
        }),
    );
    for (const result of results) {
        if (result.status === 'fulfilled') {
            submoduleRunURLs.set(result.value.commit, result.value.runURL);
        }
    }

    const sortedSubmoduleUpdates = [...submoduleUpdates].sort((a, b) => a.date.localeCompare(b.date));
    const mobileExpensifyPRsBySubmodule = new Map<string, MergedPR[]>();
    const mobileExpensifyPRsPendingSubmoduleUpdate: MergedPR[] = [];
    for (const mobileExpensifyPR of mergedMobileExpensifyPREntries) {
        const matchingUpdate = sortedSubmoduleUpdates.find((update) => update.date.localeCompare(mobileExpensifyPR.date) >= 0);
        if (matchingUpdate) {
            const existing = mobileExpensifyPRsBySubmodule.get(matchingUpdate.commit) ?? [];
            existing.push(mobileExpensifyPR);
            mobileExpensifyPRsBySubmodule.set(matchingUpdate.commit, existing);
        } else {
            mobileExpensifyPRsPendingSubmoduleUpdate.push(mobileExpensifyPR);
        }
    }

    const timeline: TimelineEntry[] = [
        ...chronologicalPREntries.map((pr): TimelineEntry => ({type: 'pr', prNumber: pr.prNumber, date: pr.date})),
        ...submoduleUpdates.map((update): TimelineEntry => ({type: 'submodule', version: update.version, date: update.date, commit: update.commit})),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let section = '<details>\n<summary><b>Chronologically ordered merged PRs (oldest first)</b></summary>\n\n';
    let prIndex = 0;
    for (const entry of timeline) {
        if (entry.type === 'submodule') {
            prIndex++;
            const runURL = submoduleRunURLs.get(entry.commit);
            const buildLink = runURL ? ` — [Adhoc Build](${runURL})` : ` — ${entry.commit.substring(0, 7)}`;
            section += `${prIndex}. Mobile-Expensify submodule update to \`${entry.version}\`${buildLink}\n`;
            const mobileExpensifyPRs = mobileExpensifyPRsBySubmodule.get(entry.commit);
            if (mobileExpensifyPRs) {
                const sortedMobileExpensifyPRs = [...mobileExpensifyPRs].sort((a, b) => a.date.localeCompare(b.date));
                for (const mobileExpensifyPR of sortedMobileExpensifyPRs) {
                    const mobileExpensifyUrl = GithubUtils.getPullRequestURLFromNumber(mobileExpensifyPR.prNumber, CONST.MOBILE_EXPENSIFY_URL);
                    section += `   ↳ ${mobileExpensifyUrl}\n`;
                }
            }
        } else {
            prIndex++;
            const url = GithubUtils.getPullRequestURLFromNumber(entry.prNumber, CONST.APP_REPO_URL);
            section += `${prIndex}. ${url}\n`;
        }
    }
    if (mobileExpensifyPRsPendingSubmoduleUpdate.length > 0) {
        const sortedPending = [...mobileExpensifyPRsPendingSubmoduleUpdate].sort((a, b) => a.date.localeCompare(b.date));
        section += `\n--- PRs waiting for Mobile-Expensify submodule update\n`;
        for (const mobileExpensifyPR of sortedPending) {
            const mobileExpensifyUrl = GithubUtils.getPullRequestURLFromNumber(mobileExpensifyPR.prNumber, CONST.MOBILE_EXPENSIFY_URL);
            section += `${mobileExpensifyUrl}\n`;
        }
    }
    section += '\n</details>';
    return section;
}

/**
 * Build params for creating a brand-new deploy checklist.
 */
function buildNewChecklistParams({
    newVersion,
    newPRNumbers,
    mergedMobileExpensifyPREntries,
    previousChecklistData,
    chronologicalSection,
}: {
    newVersion: string;
    newPRNumbers: number[];
    mergedMobileExpensifyPREntries: MergedPR[];
    previousChecklistData: StagingDeployCashData;
    chronologicalSection: string;
}) {
    return {
        tag: newVersion,
        PRList: newPRNumbers,
        PRListMobileExpensify: mergedMobileExpensifyPREntries.map((pr) => pr.prNumber),
        previousTag: previousChecklistData.version,
        chronologicalSection,
    };
}

/**
 * Build params for updating an existing open deploy checklist, preserving verified/resolved state.
 */
async function buildUpdateChecklistParams({
    newVersion,
    newPRNumbers,
    mergedMobileExpensifyPREntries,
    previousChecklistData,
    currentChecklistData,
    chronologicalSection,
}: {
    newVersion: string;
    newPRNumbers: number[];
    mergedMobileExpensifyPREntries: MergedPR[];
    previousChecklistData: StagingDeployCashData;
    currentChecklistData: StagingDeployCashData;
    chronologicalSection: string;
}) {
    const PRList = preserveCheckboxState(
        newPRNumbers.map((prNum) => ({
            number: prNum,
            url: GithubUtils.getPullRequestURLFromNumber(prNum, CONST.APP_REPO_URL),
        })),
        currentChecklistData.PRList,
    );

    const PRListMobileExpensify = preserveCheckboxState(
        mergedMobileExpensifyPREntries.map((entry) => ({
            number: entry.prNumber,
            url: GithubUtils.getPullRequestURLFromNumber(entry.prNumber, CONST.MOBILE_EXPENSIFY_URL),
        })),
        currentChecklistData.PRListMobileExpensify,
    );

    // Include existing Mobile-Expensify PRs from the current checklist that aren't in the new merged list
    for (const existingPR of currentChecklistData.PRListMobileExpensify) {
        if (!PRListMobileExpensify.some((pr) => pr.number === existingPR.number)) {
            PRListMobileExpensify.push(existingPR);
        }
    }

    const openDeployBlockers = await GithubUtils.paginate(GithubUtils.octokit.issues.listForRepo, {
        log: console,
        owner: CONST.GITHUB_OWNER,
        repo: CONST.APP_REPO,
        labels: CONST.LABELS.DEPLOY_BLOCKER,
    });

    const deployBlockers = preserveCheckboxState(
        openDeployBlockers.map((db) => ({number: db.number, url: db.html_url})),
        currentChecklistData.deployBlockers,
    );

    // Add demoted/closed blockers from current checklist and auto-check them
    for (const deployBlocker of currentChecklistData.deployBlockers) {
        const isChecked = !deployBlockers.some((openBlocker) => openBlocker.number === deployBlocker.number);
        deployBlockers.push({...deployBlocker, isChecked});
    }

    const didVersionChange = newVersion !== currentChecklistData.version;

    return {
        tag: newVersion,
        PRList: PRList.map((pr) => pr.number),
        PRListMobileExpensify: PRListMobileExpensify.map((pr) => pr.number),
        verifiedPRList: PRList.filter((pr) => pr.isChecked).map((pr) => pr.number),
        verifiedPRListMobileExpensify: PRListMobileExpensify.filter((pr) => pr.isChecked).map((pr) => pr.number),
        deployBlockers: deployBlockers.map((blocker) => blocker.url),
        resolvedDeployBlockers: deployBlockers.filter((blocker) => blocker.isChecked).map((blocker) => blocker.url),
        resolvedInternalQAPRs: currentChecklistData.internalQAPRList.filter((pr) => pr.isChecked).map((pr) => pr.number),
        isSentryChecked: didVersionChange ? false : currentChecklistData.isSentryChecked,
        isGHStatusChecked: didVersionChange ? false : currentChecklistData.isGHStatusChecked,
        previousTag: previousChecklistData.version,
        chronologicalSection,
    };
}

async function run(): Promise<IssuesCreateResponse | void> {
    // Note: require('package.json').version does not work because ncc will resolve that to a plain string at compile time
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as PackageJson;
    const newVersion = packageJson.version;
    const newStagingTag = `${packageJson.version}-staging`;

    try {
        const {data: recentDeployChecklists} = await GithubUtils.octokit.issues.listForRepo({
            log: console,
            owner: CONST.GITHUB_OWNER,
            repo: CONST.APP_REPO,
            labels: CONST.LABELS.STAGING_DEPLOY,
            state: 'all',
        });

        const mostRecentChecklist = recentDeployChecklists.at(0);
        if (!mostRecentChecklist) {
            throw new Error('Could not find the most recent checklist');
        }

        const shouldCreateNewDeployChecklist = mostRecentChecklist.state !== 'open';
        const previousChecklist = shouldCreateNewDeployChecklist ? mostRecentChecklist : recentDeployChecklists.at(1);
        if (shouldCreateNewDeployChecklist) {
            console.log('Latest StagingDeployCash is closed, creating a new one.', mostRecentChecklist);
        } else {
            console.log('Latest StagingDeployCash is open, updating it instead of creating a new one.', 'Current:', mostRecentChecklist, 'Previous:', previousChecklist);
        }

        if (!previousChecklist) {
            throw new Error('Could not find the previous checklist');
        }

        const previousChecklistData = getStagingDeployCashData(previousChecklist);
        const currentChecklistData: StagingDeployCashData | undefined = shouldCreateNewDeployChecklist ? undefined : getStagingDeployCashData(mostRecentChecklist);

        const {mergedPRs: mergedPREntries, submoduleUpdates} = await GitUtils.getMergedPRsDeployedBetween(previousChecklistData.tag, newStagingTag, CONST.APP_REPO);
        const mergedPRs = mergedPREntries.map((pr) => pr.prNumber).sort((a, b) => a - b);

        const previousPRNumbers = new Set(previousChecklistData.PRList.map((pr) => pr.number));
        const previousMobileExpensifyPRNumbers = new Set(previousChecklistData.PRListMobileExpensify.map((pr) => pr.number));
        core.startGroup('Filtering PRs:');
        core.info('mergedPRs includes cherry-picked PRs that have already been released with previous checklist, so we need to filter these out');
        core.info(`Found ${previousPRNumbers.size} PRs in the previous checklist:`);
        core.info(JSON.stringify(Array.from(previousPRNumbers)));
        const newPRNumbers = mergedPRs.filter((prNum) => !previousPRNumbers.has(prNum));
        core.info(`Found ${newPRNumbers.length} PRs deployed since the previous checklist:`);
        core.info(JSON.stringify(newPRNumbers));

        const removedPRs = mergedPRs.filter((prNum) => previousPRNumbers.has(prNum));
        if (removedPRs.length > 0) {
            core.info(`⚠️⚠️ Filtered out the following cherry-picked PRs that were released with the previous checklist: ${removedPRs.join(', ')} ⚠️⚠️`);
        }
        core.endGroup();
        console.info(`[api] Checklist PRs: ${newPRNumbers.join(', ')}`);

        let mergedMobileExpensifyPREntries: MergedPR[] = [];
        try {
            const {mergedPRs: allMobileExpensifyPREntries} = await GitUtils.getMergedPRsDeployedBetween(previousChecklistData.tag, newStagingTag, CONST.MOBILE_EXPENSIFY_REPO);
            mergedMobileExpensifyPREntries = allMobileExpensifyPREntries.filter((pr) => !previousMobileExpensifyPRNumbers.has(pr.prNumber));

            const allCount = allMobileExpensifyPREntries.length;
            const newCount = mergedMobileExpensifyPREntries.length;
            console.info(`Found ${allCount} total Mobile-Expensify PRs, ${newCount} new ones after filtering:`);
            console.info(`Mobile-Expensify PRs: ${mergedMobileExpensifyPREntries.map((pr) => pr.prNumber).join(', ')}`);

            const removedMobileExpensifyPRs = allMobileExpensifyPREntries.filter((pr) => previousMobileExpensifyPRNumbers.has(pr.prNumber));
            if (removedMobileExpensifyPRs.length > 0) {
                core.info(
                    `⚠️⚠️ Filtered out the following cherry-picked Mobile-Expensify PRs that were released with the previous checklist: ${removedMobileExpensifyPRs.map((pr) => pr.prNumber).join(', ')} ⚠️⚠️`,
                );
            }
        } catch (error) {
            if (process.env.GITHUB_REPOSITORY !== `${CONST.GITHUB_OWNER}/${CONST.APP_REPO}`) {
                console.warn(
                    "⚠️ Unable to fetch Mobile-Expensify PRs because this workflow is running on a forked repository and secrets aren't accessible. This is expected for development/testing on forks.",
                );
            } else {
                console.error('Failed to fetch Mobile-Expensify PRs:', error);
            }
        }

        const chronologicalPREntries = mergedPREntries.filter((pr) => !previousPRNumbers.has(pr.prNumber)).sort((a, b) => a.date.localeCompare(b.date));
        const chronologicalSection = await buildChronologicalSection({
            chronologicalPREntries,
            submoduleUpdates,
            mergedMobileExpensifyPREntries,
        });

        let checklistParams;
        if (shouldCreateNewDeployChecklist) {
            checklistParams = buildNewChecklistParams({
                newVersion,
                newPRNumbers,
                mergedMobileExpensifyPREntries,
                previousChecklistData,
                chronologicalSection,
            });
        } else if (currentChecklistData) {
            checklistParams = await buildUpdateChecklistParams({
                newVersion,
                newPRNumbers,
                mergedMobileExpensifyPREntries,
                previousChecklistData,
                currentChecklistData,
                chronologicalSection,
            });
        } else {
            throw new Error('Expected current checklist data for update but it was undefined');
        }

        const {issueBody: checklistBody, issueAssignees: checklistAssignees} = await generateStagingDeployCashBodyAndAssignees(checklistParams);

        const defaultPayload = {
            owner: CONST.GITHUB_OWNER,
            repo: CONST.APP_REPO,
            body: checklistBody,
        };

        if (shouldCreateNewDeployChecklist) {
            const {data: newChecklist} = await GithubUtils.octokit.issues.create({
                ...defaultPayload,
                title: `Deploy Checklist: New Expensify ${format(new Date(), CONST.DATE_FORMAT_STRING)}`,
                labels: [CONST.LABELS.STAGING_DEPLOY, CONST.LABELS.LOCK_DEPLOY],
                assignees: [CONST.APPLAUSE_BOT as string].concat(checklistAssignees),
            });
            console.log(`Successfully created new StagingDeployCash! 🎉 ${newChecklist.html_url}`);
            return newChecklist;
        }

        const {data: updatedChecklist} = await GithubUtils.octokit.issues.update({
            ...defaultPayload,
            issue_number: currentChecklistData?.number ?? 0,
        });
        console.log(`Successfully updated StagingDeployCash! 🎉 ${updatedChecklist.html_url}`);
        return updatedChecklist;
    } catch (err: unknown) {
        console.error('An unknown error occurred!', err);
        core.setFailed(err as Error);
    }
}

if (require.main === module) {
    run();
}

export default run;
export {buildChronologicalSection, buildNewChecklistParams, buildUpdateChecklistParams, preserveCheckboxState};
