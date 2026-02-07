import type GetImageCompactModeStyle from './types';

const getImageCompactModeStyle: GetImageCompactModeStyle = (maxWidth, _availableWidth, _aspectRatio, imageHeight) => {
    return {
        maxWidth,
        minHeight: 180,
        flexShrink: 1,
        alignSelf: 'center',
        width: '100%',
        marginHorizontal: 0,
        height: imageHeight ?? 'auto',
        maxHeight: imageHeight,
    };
};

export default getImageCompactModeStyle;
