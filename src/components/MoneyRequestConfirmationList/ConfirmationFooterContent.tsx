import React, {memo} from 'react';
import {View} from 'react-native';
import Button from '@components/Button';
import ButtonWithDropdownMenu from '@components/ButtonWithDropdownMenu';
import type {DropdownOption} from '@components/ButtonWithDropdownMenu/types';
import FormHelpMessage from '@components/FormHelpMessage';
import SettlementButton from '@components/SettlementButton';
import type {PaymentActionParams} from '@components/SettlementButton/types';
import EducationalTooltip from '@components/Tooltip/EducationalTooltip';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import type {IOUType} from '@src/CONST';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {PaymentMethodType} from '@src/types/onyx/OriginalMessage';

type ConfirmationFooterContentProps = {
    isReadOnly: boolean;
    iouType: IOUType;
    confirm: (params: PaymentActionParams) => void;
    iouCurrencyCode: string;
    policyID: string | undefined;
    reportID: string;
    isConfirmed: boolean | undefined;
    isConfirming: boolean | undefined;
    isLoadingReceipt: boolean;
    splitOrRequestOptions: Array<DropdownOption<string>>;
    errorMessage: string | undefined;
    expensesNumber: number;
    showRemoveExpenseConfirmModal: (() => void) | undefined;
    shouldShowProductTrainingTooltip: boolean;
    renderProductTrainingTooltip: () => React.ReactElement;
};

function ConfirmationFooterContent({
    isReadOnly,
    iouType,
    confirm,
    iouCurrencyCode,
    policyID,
    reportID,
    isConfirmed,
    isConfirming,
    isLoadingReceipt,
    splitOrRequestOptions,
    errorMessage,
    expensesNumber,
    showRemoveExpenseConfirmModal,
    shouldShowProductTrainingTooltip,
    renderProductTrainingTooltip,
}: ConfirmationFooterContentProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    if (isReadOnly) {
        return null;
    }

    const shouldShowSettlementButton = iouType === CONST.IOU.TYPE.PAY;

    const button = shouldShowSettlementButton ? (
        <SettlementButton
            pressOnEnter
            onPress={confirm}
            enablePaymentsRoute={ROUTES.ENABLE_PAYMENTS}
            chatReportID={reportID}
            shouldShowPersonalBankAccountOption
            currency={iouCurrencyCode}
            policyID={policyID}
            buttonSize={CONST.DROPDOWN_BUTTON_SIZE.LARGE}
            kycWallAnchorAlignment={{
                horizontal: CONST.MODAL.ANCHOR_ORIGIN_HORIZONTAL.LEFT,
                vertical: CONST.MODAL.ANCHOR_ORIGIN_VERTICAL.BOTTOM,
            }}
            paymentMethodDropdownAnchorAlignment={{
                horizontal: CONST.MODAL.ANCHOR_ORIGIN_HORIZONTAL.RIGHT,
                vertical: CONST.MODAL.ANCHOR_ORIGIN_VERTICAL.BOTTOM,
            }}
            enterKeyEventListenerPriority={1}
            useKeyboardShortcuts
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            isLoading={isConfirmed || isConfirming}
            sentryLabel={CONST.SENTRY_LABEL.MONEY_REQUEST.CONFIRMATION_PAY_BUTTON}
        />
    ) : (
        <>
            {expensesNumber > 1 && (
                <Button
                    large
                    text={translate('iou.removeThisExpense')}
                    onPress={showRemoveExpenseConfirmModal}
                    style={styles.mb3}
                    sentryLabel={CONST.SENTRY_LABEL.MONEY_REQUEST.CONFIRMATION_REMOVE_EXPENSE_BUTTON}
                />
            )}
            <EducationalTooltip
                shouldRender={shouldShowProductTrainingTooltip}
                renderTooltipContent={renderProductTrainingTooltip}
                anchorAlignment={{
                    horizontal: CONST.MODAL.ANCHOR_ORIGIN_HORIZONTAL.CENTER,
                    vertical: CONST.MODAL.ANCHOR_ORIGIN_VERTICAL.BOTTOM,
                }}
                wrapperStyle={styles.productTrainingTooltipWrapper}
                shouldHideOnNavigate
                shiftVertical={-10}
            >
                <View>
                    <ButtonWithDropdownMenu
                        pressOnEnter
                        onPress={(event, value) => confirm({paymentType: value as PaymentMethodType})}
                        options={splitOrRequestOptions}
                        buttonSize={CONST.DROPDOWN_BUTTON_SIZE.LARGE}
                        enterKeyEventListenerPriority={1}
                        useKeyboardShortcuts
                        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                        isLoading={isConfirmed || isConfirming || isLoadingReceipt}
                        sentryLabel={CONST.SENTRY_LABEL.MONEY_REQUEST.CONFIRMATION_SUBMIT_BUTTON}
                    />
                </View>
            </EducationalTooltip>
        </>
    );

    return (
        <>
            {!!errorMessage && (
                <FormHelpMessage
                    style={[styles.ph1, styles.mb2]}
                    isError
                    message={errorMessage}
                />
            )}
            <View>{button}</View>
        </>
    );
}

ConfirmationFooterContent.displayName = 'ConfirmationFooterContent';

export default memo(ConfirmationFooterContent);
export type {ConfirmationFooterContentProps};
