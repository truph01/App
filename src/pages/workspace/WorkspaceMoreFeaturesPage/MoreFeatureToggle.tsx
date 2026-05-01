import React from 'react';
import {View} from 'react-native';
import Hoverable from '@components/Hoverable';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useStyleUtils from '@hooks/useStyleUtils';
import useThemeStyles from '@hooks/useThemeStyles';
import ToggleSettingOptionRow from '@pages/workspace/workflows/ToggleSettingsOptionRow';
import type {Errors, PendingAction} from '@src/types/onyx/OnyxCommon';
import type IconAsset from '@src/types/utils/IconAsset';

type MoreFeatureToggleProps = {
    icon: IconAsset;
    title: string;
    subtitle: string;
    isActive: boolean;
    pendingAction: PendingAction | undefined;
    onToggle: (isEnabled: boolean) => void;
    onPress?: () => void;
    disabled?: boolean;
    disabledAction?: () => void | Promise<void>;
    errors?: Errors;
    onCloseError?: () => void;
};

function MoreFeatureToggle({icon, title, subtitle, isActive, pendingAction, onToggle, onPress, disabled, disabledAction, errors, onCloseError}: MoreFeatureToggleProps) {
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const {shouldUseNarrowLayout} = useResponsiveLayout();

    return (
        <Hoverable>
            {(hovered) => (
                <View
                    style={[
                        styles.workspaceSectionMoreFeaturesItem,
                        shouldUseNarrowLayout && styles.flexBasis100,
                        shouldUseNarrowLayout && StyleUtils.getMinimumWidth(0),
                        hovered && isActive && !!onPress && styles.hoveredComponentBG,
                    ]}
                >
                    <ToggleSettingOptionRow
                        icon={icon}
                        disabled={disabled}
                        disabledAction={disabledAction}
                        title={title}
                        titleStyle={styles.textStrong}
                        subtitle={subtitle}
                        switchAccessibilityLabel={subtitle}
                        isActive={isActive}
                        pendingAction={pendingAction}
                        onToggle={onToggle}
                        showLockIcon={disabled}
                        errors={errors}
                        onCloseError={onCloseError}
                        onPress={onPress}
                    />
                </View>
            )}
        </Hoverable>
    );
}

MoreFeatureToggle.displayName = 'MoreFeatureToggle';

export default MoreFeatureToggle;
