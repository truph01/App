import React, {useCallback, useMemo} from 'react';
import {Keyboard, View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import MoneyRequestAmountInput from '@components/MoneyRequestAmountInput';
import {PressableWithFeedback} from '@components/Pressable';
import Text from '@components/Text';
import {useCurrencyListActions} from '@hooks/useCurrencyList';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {resetSplitShares, setIndividualShare} from '@libs/actions/IOU/Split';
import {convertToBackendAmount, convertToDisplayStringWithoutCurrency} from '@libs/CurrencyUtils';
import {calculateAmount} from '@libs/IOUUtils';
import {getIOUConfirmationOptionsFromPayeePersonalDetail} from '@libs/OptionsListUtils';
import CONST from '@src/CONST';
import type * as OnyxTypes from '@src/types/onyx';
import type {Participant} from '@src/types/onyx/IOU';
import type {CurrentUserPersonalDetails} from '@src/types/onyx/PersonalDetails';

type UseSplitParticipantsParams = {
    isTypeSplit: boolean;
    shouldShowReadOnlySplits: boolean;
    payeePersonalDetails: OnyxEntry<OnyxTypes.PersonalDetails> | CurrentUserPersonalDetails;
    selectedParticipants: Participant[];
    transaction: OnyxEntry<OnyxTypes.Transaction>;
    iouAmount: number;
    iouCurrencyCode: string | undefined;
};

function useSplitParticipants({isTypeSplit, shouldShowReadOnlySplits, payeePersonalDetails, selectedParticipants, transaction, iouAmount, iouCurrencyCode}: UseSplitParticipantsParams) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {convertToDisplayString, getCurrencySymbol} = useCurrencyListActions();

    const transactionID = transaction?.transactionID;
    const onSplitShareChange = useCallback(
        (accountID: number, value: number) => {
            if (!transactionID) {
                return;
            }
            setIndividualShare(transactionID, accountID, convertToBackendAmount(value));
        },
        [transactionID],
    );

    const splitParticipants = useMemo(() => {
        if (!isTypeSplit) {
            return [];
        }

        const payeeOption = getIOUConfirmationOptionsFromPayeePersonalDetail(payeePersonalDetails);
        if (shouldShowReadOnlySplits) {
            return [payeeOption, ...selectedParticipants].map((participantOption: Participant) => {
                const isPayer = participantOption.accountID === payeeOption.accountID;
                let amount: number | undefined = 0;
                if (iouAmount > 0) {
                    amount =
                        transaction?.comment?.splits?.find((split) => split.accountID === participantOption.accountID)?.amount ??
                        calculateAmount(selectedParticipants.length, iouAmount, iouCurrencyCode ?? '', isPayer);
                }
                return {
                    ...participantOption,
                    keyForList: `${participantOption.keyForList ?? participantOption.accountID ?? participantOption.reportID}`,
                    isSelected: false,
                    isInteractive: false,
                    rightElement: (
                        <View style={[styles.flexWrap, styles.pl2]}>
                            <Text style={[styles.textLabel]}>{amount ? convertToDisplayString(amount, iouCurrencyCode) : ''}</Text>
                        </View>
                    ),
                };
            });
        }

        const currencySymbol = getCurrencySymbol(iouCurrencyCode ?? '') ?? iouCurrencyCode;
        const formattedTotalAmount = convertToDisplayStringWithoutCurrency(iouAmount, iouCurrencyCode);

        return [payeeOption, ...selectedParticipants].map((participantOption: Participant) => ({
            ...participantOption,
            tabIndex: -1,
            isSelected: false,
            isInteractive: false,
            keyForList: `${participantOption.keyForList ?? participantOption.accountID ?? participantOption.reportID}`,
            rightElement: (
                <MoneyRequestAmountInput
                    autoGrow={false}
                    amount={transaction?.splitShares?.[participantOption.accountID ?? CONST.DEFAULT_NUMBER_ID]?.amount}
                    currency={iouCurrencyCode}
                    prefixCharacter={currencySymbol}
                    disableKeyboard={false}
                    isCurrencyPressable={false}
                    hideFocusedState={false}
                    hideCurrencySymbol
                    formatAmountOnBlur
                    prefixContainerStyle={[styles.pv0, styles.h100]}
                    prefixStyle={styles.lineHeightUndefined}
                    inputStyle={[styles.optionRowAmountInput, styles.lineHeightUndefined]}
                    containerStyle={[styles.textInputContainer, styles.pl2, styles.pr1]}
                    touchableInputWrapperStyle={[styles.ml3]}
                    onFormatAmount={convertToDisplayStringWithoutCurrency}
                    onAmountChange={(value: string) => onSplitShareChange(participantOption.accountID ?? CONST.DEFAULT_NUMBER_ID, Number(value))}
                    maxLength={formattedTotalAmount.length + 1}
                    contentWidth={(formattedTotalAmount.length + 1) * CONST.CHARACTER_WIDTH}
                    shouldApplyPaddingToContainer
                    shouldUseDefaultLineHeightForPrefix={false}
                    shouldWrapInputInContainer={false}
                />
            ),
        }));
    }, [
        isTypeSplit,
        payeePersonalDetails,
        shouldShowReadOnlySplits,
        iouCurrencyCode,
        iouAmount,
        selectedParticipants,
        styles.flexWrap,
        styles.pl2,
        styles.pr1,
        styles.h100,
        styles.textLabel,
        styles.pv0,
        styles.lineHeightUndefined,
        styles.optionRowAmountInput,
        styles.textInputContainer,
        styles.ml3,
        transaction?.comment?.splits,
        transaction?.splitShares,
        onSplitShareChange,
        getCurrencySymbol,
        convertToDisplayString,
    ]);

    const isSplitModified = !!transaction?.splitShares && Object.keys(transaction.splitShares).some((key) => transaction.splitShares?.[Number(key) ?? -1]?.isModified);

    const getSplitSectionHeader = () => (
        <View style={[styles.mt2, styles.mb1, styles.flexRow, styles.justifyContentBetween]}>
            <Text style={[styles.ph5, styles.textLabelSupporting]}>{translate('iou.participants')}</Text>
            {!shouldShowReadOnlySplits && !!isSplitModified && (
                <PressableWithFeedback
                    onPress={() => {
                        // Dismiss the keyboard so that MoneyRequestAmountInput's useEffect syncs the new amount.
                        // Without this, the effect skips the update while the input is focused (see formatAmountOnBlur guard).
                        Keyboard.dismiss();
                        resetSplitShares(transaction);
                    }}
                    accessibilityLabel={CONST.ROLE.BUTTON}
                    role={CONST.ROLE.BUTTON}
                    shouldUseAutoHitSlop
                    sentryLabel={CONST.SENTRY_LABEL.REQUEST_CONFIRMATION_LIST.RESET_SPLIT_SHARES}
                >
                    <Text style={[styles.pr5, styles.textLabelSupporting, styles.link]}>{translate('common.reset')}</Text>
                </PressableWithFeedback>
            )}
        </View>
    );

    return {splitParticipants, getSplitSectionHeader};
}

export default useSplitParticipants;
