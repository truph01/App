import React, {useMemo} from 'react';
import type {ColorValue, StyleProp, ViewStyle} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {usePersonalDetails} from '@components/OnyxListItemProvider';
import {shouldOptionShowTooltip} from '@libs/OptionsListUtils';
import {getDelegateAccountIDFromReportAction} from '@libs/ReportActionsUtils';
import type {OptionData} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import type {Report} from '@src/types/onyx';
import LHNAvatar from './LHNAvatar';

type OptionRowAvatarProps = {
    optionItem: OptionData;
    report: OnyxEntry<Report>;
    isInFocusMode: boolean;
    subscriptAvatarBorderColor: ColorValue;
    secondaryAvatarBackgroundColor: ColorValue;
    singleAvatarContainerStyle: StyleProp<ViewStyle>;
};

function OptionRowAvatar({optionItem, report, isInFocusMode, subscriptAvatarBorderColor, secondaryAvatarBackgroundColor, singleAvatarContainerStyle}: OptionRowAvatarProps) {
    const personalDetails = usePersonalDetails();

    const delegateAccountID = useMemo(
        () => getDelegateAccountIDFromReportAction(optionItem?.parentReportAction),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- getDelegateAccountIDFromReportAction is a stable import; only parentReportAction determines the result
        [optionItem?.parentReportAction],
    );

    // Match the header's delegate avatar logic: when a delegate exists on the
    // parent report action, the header (useReportActionAvatars) shows the
    // delegate's avatar as primary instead of the report owner's.
    const skipDelegate = report?.type === CONST.REPORT.TYPE.INVOICE || (optionItem?.isTaskReport && !report?.chatReportID);

    const icons = useMemo(() => {
        let result = optionItem?.icons ?? [];
        if (!skipDelegate && delegateAccountID && personalDetails && result.length > 0) {
            const delegateDetails = personalDetails[delegateAccountID];
            if (delegateDetails) {
                const updatedIcons = [...result];
                const firstIcon = updatedIcons.at(0);
                if (firstIcon) {
                    updatedIcons[0] = {
                        ...firstIcon,
                        source: delegateDetails.avatar ?? '',
                        name: delegateDetails.displayName ?? '',
                        id: delegateAccountID,
                    };
                }
                result = updatedIcons;
            }
        }

        return result;
    }, [optionItem?.icons, skipDelegate, delegateAccountID, personalDetails]);

    const delegateTooltipAccountID = useMemo(() => {
        if (!skipDelegate && delegateAccountID && personalDetails?.[delegateAccountID] && optionItem?.icons?.length) {
            return Number(optionItem.icons.at(0)?.id ?? CONST.DEFAULT_NUMBER_ID);
        }
        return undefined;
    }, [skipDelegate, delegateAccountID, personalDetails, optionItem?.icons]);

    const firstIcon = optionItem.icons?.at(0);

    if (!optionItem.icons?.length || !firstIcon) {
        return null;
    }

    return (
        <LHNAvatar
            icons={icons}
            shouldShowSubscript={!!optionItem.shouldShowSubscript}
            size={isInFocusMode ? CONST.AVATAR_SIZE.SMALL : CONST.AVATAR_SIZE.DEFAULT}
            subscriptAvatarBorderColor={subscriptAvatarBorderColor}
            useMidSubscriptSize={isInFocusMode}
            secondaryAvatarBackgroundColor={secondaryAvatarBackgroundColor}
            singleAvatarContainerStyle={singleAvatarContainerStyle}
            shouldShowTooltip={shouldOptionShowTooltip(optionItem)}
            delegateAccountID={skipDelegate ? undefined : delegateAccountID}
            delegateTooltipAccountID={delegateTooltipAccountID}
        />
    );
}

OptionRowAvatar.displayName = 'OptionRowAvatar';

export default OptionRowAvatar;
