/**
 * Component test for WorkspaceWorkflowsApprovalsEditPage.
 *
 * Regresses on issue #83251: when editing a self-approval workflow (user A submits to user A),
 * availableMembers must not contain duplicate entries. Raw concatenation
 * [...members, ...defaultWorkflowMembers] produces duplicates because defaultWorkflowMembers
 * (from convertPolicyEmployeesToApprovalWorkflows) now includes all workspace members.
 * This test verifies the page uses mergeWorkflowMembersWithAvailableMembers.
 */

import {act, render} from '@testing-library/react-native';
import React from 'react';
import Onyx from 'react-native-onyx';
import ComposeProviders from '@components/ComposeProviders';
import {LocaleContextProvider} from '@components/LocaleContextProvider';
import OnyxListItemProvider from '@components/OnyxListItemProvider';
import * as Workflow from '@userActions/Workflow';
import WorkspaceWorkflowsApprovalsEditPage from '@pages/workspace/workflows/approvals/WorkspaceWorkflowsApprovalsEditPage';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Policy} from '@src/types/onyx';
import type {PersonalDetailsList} from '@src/types/onyx/PersonalDetails';
import type {PolicyEmployeeList} from '@src/types/onyx/PolicyEmployee';
import {buildPersonalDetails} from '../utils/TestHelper';
import waitForBatchedUpdatesWithAct from '../utils/waitForBatchedUpdatesWithAct';

const POLICY_ID = 'workflow-approvals-edit-test-policy';
const ALICE_EMAIL = 'alice@example.com';

jest.mock('@react-navigation/native', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const actualNav = jest.requireActual('@react-navigation/native');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
        ...actualNav,
        useIsFocused: () => true,
        usePreventRemove: jest.fn(),
    };
});

jest.mock('@libs/Navigation/Navigation', () => ({
    goBack: jest.fn(),
    dismissModal: jest.fn(),
}));

function buildPolicy(employeeList: PolicyEmployeeList): Policy {
    return {
        id: POLICY_ID,
        name: 'Test Workspace',
        type: CONST.POLICY.TYPE.CORPORATE,
        role: CONST.POLICY.ROLE.ADMIN,
        owner: ALICE_EMAIL,
        employeeList,
        approver: ALICE_EMAIL,
        areWorkflowsEnabled: true,
        isPolicyExpenseChatEnabled: true,
        outputCurrency: 'USD',
        avatarURL: '',
        lastModified: new Date().toISOString(),
        pendingAction: null,
        errors: {},
    } as Policy;
}

function buildPersonalDetailsList(): PersonalDetailsList {
    return {
        1: buildPersonalDetails(ALICE_EMAIL, 1, 'alice'),
    };
}

const mockRoute = {
    key: 'test-route',
    name: 'Workspace_Approvals_Edit',
    params: {
        policyID: POLICY_ID,
        firstApproverEmail: ALICE_EMAIL,
    },
};

const renderEditPage = () =>
    render(
        <ComposeProviders components={[OnyxListItemProvider, LocaleContextProvider]}>
            <WorkspaceWorkflowsApprovalsEditPage
                // @ts-expect-error - route type from navigator
                route={mockRoute}
            />
        </ComposeProviders>,
    );

describe('WorkspaceWorkflowsApprovalsEditPage', () => {
    beforeAll(async () => {
        Onyx.init({keys: ONYXKEYS});
    });

    beforeEach(async () => {
        jest.spyOn(Workflow, 'setApprovalWorkflow');
        await act(async () => {
            await Onyx.clear();
            await Onyx.set(ONYXKEYS.HAS_LOADED_APP, true);
            await Onyx.set(ONYXKEYS.IS_LOADING_REPORT_DATA, false);

            const employeeList: PolicyEmployeeList = {
                [ALICE_EMAIL]: {
                    email: ALICE_EMAIL,
                    submitsTo: ALICE_EMAIL,
                    forwardsTo: undefined,
                },
            };
            const policy = buildPolicy(employeeList);
            const personalDetails = buildPersonalDetailsList();

            await Onyx.set(`${ONYXKEYS.COLLECTION.POLICY}${POLICY_ID}`, policy);
            await Onyx.set(ONYXKEYS.PERSONAL_DETAILS_LIST, personalDetails);
            await Onyx.merge(ONYXKEYS.SESSION, {email: ALICE_EMAIL, accountID: 1});
            await waitForBatchedUpdatesWithAct();
        });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await act(async () => {
            await Onyx.clear();
            await waitForBatchedUpdatesWithAct();
        });
    });

    it('should pass deduplicated availableMembers to setApprovalWorkflow for self-approval workflow', async () => {
        renderEditPage();
        await waitForBatchedUpdatesWithAct();

        expect(Workflow.setApprovalWorkflow).toHaveBeenCalled();
        const callArg = (Workflow.setApprovalWorkflow as jest.Mock).mock.calls[0][0];
        const availableMembers = callArg.availableMembers ?? [];
        const emails = availableMembers.map((m: {email: string}) => m.email);
        const uniqueEmails = [...new Set(emails)];

        expect(emails.length).toBe(uniqueEmails.length);
        expect(emails).toContain(ALICE_EMAIL);
    });
});
