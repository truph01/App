/* eslint-disable @typescript-eslint/naming-convention */
/**
 * @jest-environment node
 */
import * as core from '@actions/core';
import run from '@github/actions/javascript/waitForPreviousRuns/waitForPreviousRuns';
import type {InternalOctokit} from '@github/libs/GithubUtils';
import GithubUtils from '@github/libs/GithubUtils';
import asMutable from '@src/types/utils/asMutable';

const CURRENT_RUN_ID = 1000;
const WORKFLOW_ID = 'testBuildOnPush.yml';
const TEST_POLL_RATE = 1;
const REQUIRED_CLEAN_CHECKS = 3;

type WorkflowRun = {id: number; status: string};
type MockListResponse = {data: {workflow_runs: WorkflowRun[]}};
type MockedListFn = jest.MockedFunction<() => Promise<MockListResponse>>;

const mockGetInput = jest.fn();
const mockListInProgress: MockedListFn = jest.fn();
const mockListQueued: MockedListFn = jest.fn();
const mockListWorkflowRuns = jest.fn().mockImplementation((args: {status: string}) => {
    if (args.status === 'in_progress') {
        return mockListInProgress();
    }
    if (args.status === 'queued') {
        return mockListQueued();
    }
    return Promise.resolve({data: {workflow_runs: []}});
});

const coreInfoSpy = jest.spyOn(core, 'info');

function getInfoMessages(): string[] {
    return coreInfoSpy.mock.calls.map((call) => String(call[0]));
}

/** Mock a single poll response. Defaults to empty for both statuses. */
function mockPoll(inProgress: WorkflowRun[] = [], queued: WorkflowRun[] = []) {
    mockListInProgress.mockResolvedValueOnce({data: {workflow_runs: inProgress}});
    mockListQueued.mockResolvedValueOnce({data: {workflow_runs: queued}});
}

/** Mock N consecutive empty polls (needed for requiredCleanChecks). */
function mockEmptyPolls(count: number) {
    for (let i = 0; i < count; i++) {
        mockPoll();
    }
}

jest.mock('@github/libs/CONST', () => ({
    __esModule: true,
    default: {
        POLL_RATE: TEST_POLL_RATE,
        RUN_STATUS: {
            IN_PROGRESS: 'in_progress',
            QUEUED: 'queued',
        },
    },
}));

beforeAll(() => {
    asMutable(core).getInput = mockGetInput;

    mockGetInput.mockImplementation((name: string) => {
        if (name === 'WORKFLOW_ID') {
            return WORKFLOW_ID;
        }
        if (name === 'CURRENT_RUN_ID') {
            return String(CURRENT_RUN_ID);
        }
        return '';
    });

    GithubUtils.internalOctokit = {
        rest: {
            actions: {
                ...(GithubUtils.internalOctokit as unknown as typeof GithubUtils.octokit.actions),
                listWorkflowRuns: mockListWorkflowRuns as unknown as typeof GithubUtils.octokit.actions.listWorkflowRuns,
            },
        },
    } as InternalOctokit;
});

beforeEach(() => {
    coreInfoSpy.mockClear();
    mockListWorkflowRuns.mockClear();
    mockListInProgress.mockClear();
    mockListQueued.mockClear();
});

describe('waitForPreviousRuns', () => {
    test('Should proceed after consecutive clean checks when no earlier runs exist', () => {
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('1/3 clean checks'))).toBe(true);
            expect(getInfoMessages().some((msg) => msg.includes('2/3 clean checks'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should proceed after consecutive clean checks when only newer runs exist', () => {
        mockPoll([{id: 2000, status: 'in_progress'}], [{id: 3000, status: 'queued'}]);
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should wait for older in-progress runs to finish', () => {
        mockPoll([{id: 500, status: 'in_progress'}]);
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should wait for older queued runs to finish', () => {
        mockPoll([], [{id: 800, status: 'queued'}]);
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should wait across multiple polls until older run finishes', () => {
        mockPoll([{id: 500, status: 'in_progress'}]);
        mockPoll([{id: 500, status: 'in_progress'}]);
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should ignore newer runs and only wait for older ones', () => {
        // Older run in progress, newer run queued
        mockPoll([{id: 500, status: 'in_progress'}], [{id: 2000, status: 'queued'}]);
        // Older run finished, newer still queued (ignored)
        mockPoll([], [{id: 2000, status: 'queued'}]);
        mockPoll([], [{id: 2000, status: 'queued'}]);
        mockPoll([], [{id: 2000, status: 'queued'}]);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });

    test('Should wait through a 4-run queue in FIFO order', () => {
        // #500 in_progress, #800 and #1200 queued
        mockPoll([{id: 500, status: 'in_progress'}], [{id: 800, status: 'queued'}, {id: 1200, status: 'queued'}]);
        // #500 done, #800 now in progress
        mockPoll([{id: 800, status: 'in_progress'}], [{id: 1200, status: 'queued'}]);
        // #800 done, only #1200 queued (newer, ignored) — 3 clean checks
        mockPoll([], [{id: 1200, status: 'queued'}]);
        mockPoll([], [{id: 1200, status: 'queued'}]);
        mockPoll([], [{id: 1200, status: 'queued'}]);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 2 earlier run(s):'))).toBe(true);
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
            expect(getInfoMessages().some((msg) => msg.includes('1200'))).toBe(false);
        });
    });

    test('Should reset clean check counter if an earlier run reappears (API flicker)', () => {
        // Clean check 1
        mockPoll();
        // Run flickers back — resets counter
        mockPoll([{id: 500, status: 'in_progress'}]);
        // Need 3 fresh clean checks
        mockEmptyPolls(REQUIRED_CLEAN_CHECKS);

        return run().then(() => {
            expect(getInfoMessages().some((msg) => msg.includes('1/3 clean checks'))).toBe(true);
            expect(getInfoMessages().some((msg) => msg.includes('Waiting for 1 earlier run(s):'))).toBe(true);
            expect(coreInfoSpy).toHaveBeenCalledWith('No earlier runs in progress. Proceeding with build.');
        });
    });
});
