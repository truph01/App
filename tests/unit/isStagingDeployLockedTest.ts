/**
 * @jest-environment node
 */
import * as core from '@actions/core';
import run from '../../.github/actions/javascript/isStagingDeployLocked/isStagingDeployLocked';
import * as StagingDeployUtils from '../../.github/libs/StagingDeployUtils';

jest.mock('../../.github/libs/StagingDeployUtils');

beforeAll(() => {
    process.env.INPUT_GITHUB_TOKEN = 'fake_token';
});

beforeEach(() => {
    jest.resetModules();
});

afterAll(() => {
    delete process.env.INPUT_GITHUB_TOKEN;
});

describe('isStagingDeployLockedTest', () => {
    describe('GitHub action run function', () => {
        test('Test returning empty result', () => {
            (StagingDeployUtils.getStagingDeployCash as jest.Mock).mockResolvedValue({});
            const setOutputMock = jest.spyOn(core, 'setOutput');
            const isStagingDeployLocked = run();
            return isStagingDeployLocked.then(() => {
                expect(setOutputMock).toHaveBeenCalledWith('IS_LOCKED', false);
            });
        });

        test('Test returning valid locked issue', () => {
            const mockData = {
                labels: [{name: '🔐 LockCashDeploys 🔐'}],
            };

            (StagingDeployUtils.getStagingDeployCash as jest.Mock).mockResolvedValue(mockData);
            const setOutputMock = jest.spyOn(core, 'setOutput');
            const isStagingDeployLocked = run();
            return isStagingDeployLocked.then(() => {
                expect(setOutputMock).toHaveBeenCalledWith('IS_LOCKED', true);
            });
        });
    });
});
