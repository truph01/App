import {render, screen} from '@testing-library/react-native';
import React from 'react';
import {View} from 'react-native';
import ReportActionsListHeader from '@pages/inbox/report/ReportActionsListHeader';

const CONCIERGE_REPORT_ID = '7000';
const OTHER_REPORT_ID = '42';

const mockUseIsInSidePanel = jest.fn<boolean, []>();
const mockUseOnyx = jest.fn();

jest.mock('@hooks/useIsInSidePanel', () => ({
    __esModule: true,
    default: () => mockUseIsInSidePanel(),
}));

jest.mock('@hooks/useOnyx', () => ({
    __esModule: true,
    default: (key: string) => mockUseOnyx(key),
}));

jest.mock('@pages/home/report/ConciergeThinkingMessage', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const {View: MockView} = require('react-native');
    return {
        __esModule: true,
        default: () => <MockView testID="ConciergeThinkingMessage" />,
    };
});

jest.mock('@pages/inbox/report/ListBoundaryLoader', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const {View: MockView, Pressable} = require('react-native');
    return {
        __esModule: true,
        default: ({onRetry}: {onRetry: () => void}) => (
            <Pressable
                testID="ListBoundaryLoader"
                onPress={onRetry}
            >
                <MockView />
            </Pressable>
        ),
    };
});

function stubOnyx({reportID, conciergeReportID}: {reportID: string; conciergeReportID: string}) {
    mockUseOnyx.mockImplementation((key: string) => {
        if (key.startsWith('report_')) {
            return [{reportID, chatType: undefined, participants: {[conciergeReportID]: {}}}];
        }
        if (key === 'conciergeReportID') {
            return [conciergeReportID];
        }
        return [undefined];
    });
}

describe('ReportActionsListHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('always renders ListBoundaryLoader', () => {
        mockUseIsInSidePanel.mockReturnValue(false);
        stubOnyx({reportID: OTHER_REPORT_ID, conciergeReportID: CONCIERGE_REPORT_ID});
        render(
            <ReportActionsListHeader
                reportID={OTHER_REPORT_ID}
                onRetry={jest.fn()}
            />,
        );
        expect(screen.getByTestId('ListBoundaryLoader')).toBeTruthy();
    });

    it('renders ConciergeThinkingMessage only when in the concierge side panel', () => {
        mockUseIsInSidePanel.mockReturnValue(true);
        stubOnyx({reportID: CONCIERGE_REPORT_ID, conciergeReportID: CONCIERGE_REPORT_ID});
        render(
            <ReportActionsListHeader
                reportID={CONCIERGE_REPORT_ID}
                onRetry={jest.fn()}
            />,
        );
        expect(screen.getByTestId('ConciergeThinkingMessage')).toBeTruthy();
    });

    it('does not render ConciergeThinkingMessage outside the side panel', () => {
        mockUseIsInSidePanel.mockReturnValue(false);
        stubOnyx({reportID: CONCIERGE_REPORT_ID, conciergeReportID: CONCIERGE_REPORT_ID});
        render(
            <ReportActionsListHeader
                reportID={CONCIERGE_REPORT_ID}
                onRetry={jest.fn()}
            />,
        );
        expect(screen.queryByTestId('ConciergeThinkingMessage')).toBeNull();
    });

    it('does not render ConciergeThinkingMessage for non-concierge reports in the side panel', () => {
        mockUseIsInSidePanel.mockReturnValue(true);
        stubOnyx({reportID: OTHER_REPORT_ID, conciergeReportID: CONCIERGE_REPORT_ID});
        render(
            <ReportActionsListHeader
                reportID={OTHER_REPORT_ID}
                onRetry={jest.fn()}
            />,
        );
        expect(screen.queryByTestId('ConciergeThinkingMessage')).toBeNull();
    });
});
