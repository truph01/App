import type {ThemeColors} from '@styles/theme/types';

function getTabIconFill(theme: ThemeColors, isSelected: boolean, isHovered: boolean): string {
    if (isSelected) {
        return theme.iconMenu;
    }
    if (isHovered) {
        return theme.success;
    }
    return theme.icon;
}

export default getTabIconFill;
