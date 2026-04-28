import {render} from '@testing-library/react-native';
import React from 'react';
import ConnectToQuickbooksDesktopFlow from '@components/ConnectToQuickbooksDesktopFlow';
import useReusablePoliciesConnectedTo from '@hooks/useReusablePoliciesConnectedTo';
import Navigation from '@libs/Navigation/Navigation';
import getQuickbooksDesktopSetupEntryRoute from '@pages/workspace/accounting/qbd/utils';
import ROUTES from '@src/ROUTES';

jest.mock('@hooks/useReusablePoliciesConnectedTo');
jest.mock('@libs/Navigation/Navigation', () => ({
    navigate: jest.fn(),
}));

const mockedUseReusablePoliciesConnectedTo = jest.mocked(useReusablePoliciesConnectedTo);
const mockedNavigate = jest.mocked(Navigation.navigate);

describe('ConnectToQuickbooksDesktopFlow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('routes to reusable connections when an eligible QBD workspace exists', () => {
        const policyID = '123';
        mockedUseReusablePoliciesConnectedTo.mockReturnValue({
            hasReusablePoliciesConnectedTo: true,
            reusablePoliciesConnectedTo: [],
        });

        render(<ConnectToQuickbooksDesktopFlow policyID={policyID} />);

        expect(mockedNavigate).toHaveBeenCalledWith(ROUTES.POLICY_ACCOUNTING_QUICKBOOKS_DESKTOP_EXISTING_CONNECTIONS.getRoute(policyID));
    });

    it('routes to the QBD setup flow when no reusable QBD workspaces exist', () => {
        const policyID = '123';
        mockedUseReusablePoliciesConnectedTo.mockReturnValue({
            hasReusablePoliciesConnectedTo: false,
            reusablePoliciesConnectedTo: [],
        });

        render(<ConnectToQuickbooksDesktopFlow policyID={policyID} />);

        expect(mockedNavigate).toHaveBeenCalledWith(getQuickbooksDesktopSetupEntryRoute(policyID));
    });
});
