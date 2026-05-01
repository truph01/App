import React from 'react';
import {View} from 'react-native';
import Avatar from '@components/Avatar';
import Text from '@components/Text';
import useThemeStyles from '@hooks/useThemeStyles';
import type {AvatarSource} from '@libs/UserAvatarUtils';
import CONST from '@src/CONST';

type AgentsListRowProps = {
    /** Account ID of the agent */
    accountID: number;

    /** Display name of the agent */
    displayName: string;

    /** Login email of the agent */
    login: string;

    /** Avatar source of the agent */
    avatar: AvatarSource;
};

function AgentsListRow({accountID, displayName, login, avatar}: AgentsListRowProps) {
    const styles = useThemeStyles();

    return (
        <View style={[styles.flexRow, styles.alignItemsCenter, styles.p5, styles.gap3]}>
            <Avatar
                size={CONST.AVATAR_SIZE.DEFAULT}
                source={avatar}
                avatarID={accountID}
                name={displayName}
                type={CONST.ICON_TYPE_AVATAR}
            />
            <View style={styles.flex1}>
                <Text
                    numberOfLines={1}
                    style={styles.textStrong}
                >
                    {displayName}
                </Text>
                <Text
                    numberOfLines={1}
                    style={[styles.textMicro, styles.textSupporting]}
                >
                    {login}
                </Text>
            </View>
            {/* Chat, Co-pilot and Edit buttons will be added in R1.3 */}
        </View>
    );
}

export default AgentsListRow;
