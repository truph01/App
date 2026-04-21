import {fireEvent, render, screen} from '@testing-library/react-native';
import React from 'react';
import OnyxListItemProvider from '@components/OnyxListItemProvider';
import ShowPreviousMessagesButton from '@pages/inbox/report/ShowPreviousMessagesButton';
import CONST from '@src/CONST';
import type {ReportAction} from '@src/types/onyx';

jest.mock('@hooks/useLazyAsset', () => ({
    useMemoizedLazyExpensifyIcons: () => ({UpArrow: 'UpArrow'}),
}));

function buildAction(actionName: string): ReportAction {
    return {
        reportActionID: '1',
        actionName,
        created: '2026-04-21 00:00:00',
    } as unknown as ReportAction;
}

const renderButton = (overrides: Partial<React.ComponentProps<typeof ShowPreviousMessagesButton>> = {}) => {
    const props = {
        reportAction: buildAction(CONST.REPORT.ACTIONS.TYPE.CREATED),
        hasPreviousMessages: true,
        showFullHistory: false,
        onPress: jest.fn(),
        ...overrides,
    };
    render(
        <OnyxListItemProvider>
            <ShowPreviousMessagesButton
                reportAction={props.reportAction}
                hasPreviousMessages={props.hasPreviousMessages}
                showFullHistory={props.showFullHistory}
                onPress={props.onPress}
            />
        </OnyxListItemProvider>,
    );
    return props;
};

describe('ShowPreviousMessagesButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the button when all gates pass', () => {
        renderButton();
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('fires onPress when tapped', () => {
        const {onPress} = renderButton();
        fireEvent.press(screen.getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when the report action is not CREATED', () => {
        renderButton({reportAction: buildAction(CONST.REPORT.ACTIONS.TYPE.ADD_COMMENT)});
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders nothing when hasPreviousMessages is false', () => {
        renderButton({hasPreviousMessages: false});
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders nothing when showFullHistory is true', () => {
        renderButton({showFullHistory: true});
        expect(screen.queryByRole('button')).toBeNull();
    });
});
