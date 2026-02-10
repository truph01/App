import React, {useCallback, useMemo} from 'react';
import {View} from 'react-native';
import Avatar from '@components/Avatar';
import Checkbox from '@components/Checkbox';
import useThemeStyles from '@hooks/useThemeStyles';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import RadioListItem from './RadioListItem';
import type {ListItem, SingleSelectListItemProps} from './types';

/**
 * SingleSelectListItem mirrors the behavior of a default RadioListItem, but adds support
 * for the new style of single selection lists.
 */
function SingleSelectWithAvatarListItem<TItem extends ListItem>({
    item,
    isFocused,
    showTooltip,
    isDisabled,
    onSelectRow,
    onDismissError,
    shouldPreventEnterKeySubmit,
    isMultilineSupported = false,
    isAlternateTextMultilineSupported = false,
    alternateTextNumberOfLines = 2,
    onFocus,
    shouldSyncFocus,
    wrapperStyle,
    titleStyles,
    shouldHighlightSelectedItem = true,
}: SingleSelectListItemProps<TItem>) {
    const styles = useThemeStyles();
    const isSelected = item.isSelected;
    const icon = item.icons?.at(0);

    const radioCheckboxComponent = useCallback(() => {
        return (
            <Checkbox
                shouldSelectOnPressEnter
                containerBorderRadius={999}
                accessibilityLabel="SingleSelectListItem"
                isChecked={isSelected}
                onPress={() => onSelectRow(item)}
            />
        );
    }, [isSelected, item, onSelectRow]);

    const {itemWithAvatar, computedWrapperStyle} = useMemo(() => {
        if (!icon) {
            return {
                itemWithAvatar: item,
                computedWrapperStyle: [wrapperStyle, styles.optionRowCompact],
            };
        }

        const avatarElement = (
            <View style={[styles.mr3]}>
                <Avatar
                    source={icon.source}
                    size={CONST.AVATAR_SIZE.DEFAULT}
                    name={icon.name}
                    avatarID={icon.id}
                    type={icon.type ?? CONST.ICON_TYPE_AVATAR}
                    fallbackIcon={icon.fallbackIcon}
                    iconAdditionalStyles={[{width: variables.avatarSizeNormal, height: variables.avatarSizeNormal}]}
                />
            </View>
        );

        return {
            itemWithAvatar: {...item, leftElement: avatarElement},
            computedWrapperStyle: [wrapperStyle, styles.pv0, styles.mnh13],
        };
    }, [icon, item, wrapperStyle, styles.mr3, styles.optionRowCompact, styles.pv0, styles.mnh13]);

    return (
        <RadioListItem
            item={itemWithAvatar}
            isFocused={isFocused}
            showTooltip={showTooltip}
            isDisabled={isDisabled}
            rightHandSideComponent={radioCheckboxComponent}
            onSelectRow={onSelectRow}
            accessibilityRole={CONST.ROLE.RADIO}
            onDismissError={onDismissError}
            shouldPreventEnterKeySubmit={shouldPreventEnterKeySubmit}
            isMultilineSupported={isMultilineSupported}
            isAlternateTextMultilineSupported={isAlternateTextMultilineSupported}
            alternateTextNumberOfLines={alternateTextNumberOfLines}
            onFocus={onFocus}
            shouldSyncFocus={shouldSyncFocus}
            wrapperStyle={computedWrapperStyle}
            titleStyles={titleStyles}
            shouldHighlightSelectedItem={shouldHighlightSelectedItem}
        />
    );
}

export default SingleSelectWithAvatarListItem;
