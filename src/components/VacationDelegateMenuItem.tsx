import React from 'react';
import {View} from 'react-native';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import usePersonalDetailsByLogin from '@hooks/usePersonalDetailsByLogin';
import useThemeStyles from '@hooks/useThemeStyles';
import {formatPhoneNumber} from '@libs/LocalePhoneNumber';
import CONST from '@src/CONST';
import type {Errors, PendingAction} from '@src/types/onyx/OnyxCommon';
import type {BaseVacationDelegate} from '@src/types/onyx/VacationDelegate';
import MenuItem from './MenuItem';
import OfflineWithFeedback from './OfflineWithFeedback';
import Text from './Text';

type VacationDelegateSectionProps = {
    /** Currently selected vacation delegate (if any) */
    vacationDelegate?: BaseVacationDelegate;

    /** Errors related to setting the vacation delegate */
    errors?: Errors;

    /** Pending actions related to setting the vacation delegate */
    pendingAction?: PendingAction;

    /**
     * Callback used to clear/reset errors related to the vacation delegate
     */
    onCloseError: () => void;

    /**
     * Callback triggered when the section is pressed.
     * Should navigate the user to the vacation delegate selection screen.
     */
    onPress: () => void;

    /**
     *
     */
    cannotSetDelegateMessage?: string;
};

function VacationDelegateMenuItem({vacationDelegate, errors, pendingAction, onCloseError, onPress, cannotSetDelegateMessage}: VacationDelegateSectionProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const icons = useMemoizedLazyExpensifyIcons(['FallbackAvatar']);
    const personalDetailsByLogin = usePersonalDetailsByLogin();

    const hasVacationDelegate = !!vacationDelegate?.delegate;
    const hasActiveDelegations = !!vacationDelegate?.delegatorFor?.length;
    const vacationDelegatePersonalDetails = personalDetailsByLogin[vacationDelegate?.delegate?.toLowerCase() ?? ''];
    const formattedDelegateLogin = formatPhoneNumber(vacationDelegatePersonalDetails?.login ?? '');
    const fallbackVacationDelegateLogin = formattedDelegateLogin === '' ? vacationDelegate?.delegate : formattedDelegateLogin;

    const renderDelegatorList = () => {
        return vacationDelegate?.delegatorFor?.map((delegatorEmail) => {
            const delegatorDetails = personalDetailsByLogin[delegatorEmail.toLowerCase()];
            const formattedLogin = formatPhoneNumber(delegatorDetails?.login ?? '');
            const displayLogin = formattedLogin || delegatorEmail;

            return (
                <MenuItem
                    key={delegatorEmail}
                    title={delegatorDetails?.displayName ?? displayLogin}
                    description={displayLogin}
                    avatarID={delegatorDetails?.accountID ?? CONST.DEFAULT_NUMBER_ID}
                    icon={delegatorDetails?.avatar ?? icons.FallbackAvatar}
                    iconType={CONST.ICON_TYPE_AVATAR}
                    numberOfLinesDescription={1}
                    containerStyle={[styles.pr2, styles.mt1]}
                    interactive={false}
                />
            );
        });
    };

    if (hasActiveDelegations) {
        return (
            <View>
                <Text style={[styles.mh5, styles.mb4]}>{cannotSetDelegateMessage}</Text>
                {renderDelegatorList()}
            </View>
        );
    }

    return hasVacationDelegate ? (
        <>
            <Text style={[styles.mh5, styles.mt5, styles.mutedTextLabel]}>{translate('common.vacationDelegate')}</Text>
            <OfflineWithFeedback
                pendingAction={pendingAction}
                errors={errors}
                errorRowStyles={styles.mh5}
                onClose={onCloseError}
            >
                <MenuItem
                    title={vacationDelegatePersonalDetails?.displayName ?? fallbackVacationDelegateLogin}
                    description={fallbackVacationDelegateLogin}
                    avatarID={vacationDelegatePersonalDetails?.accountID ?? CONST.DEFAULT_NUMBER_ID}
                    icon={vacationDelegatePersonalDetails?.avatar ?? icons.FallbackAvatar}
                    iconType={CONST.ICON_TYPE_AVATAR}
                    numberOfLinesDescription={1}
                    shouldShowRightIcon
                    onPress={onPress}
                    containerStyle={styles.pr2}
                />
            </OfflineWithFeedback>
        </>
    ) : (
        <MenuItem
            description={translate('common.vacationDelegate')}
            shouldShowRightIcon
            onPress={onPress}
            containerStyle={styles.pr2}
        />
    );
}

export default VacationDelegateMenuItem;
