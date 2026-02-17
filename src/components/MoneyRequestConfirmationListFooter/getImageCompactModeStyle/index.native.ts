import type GetImageCompactModeStyle from './types';

const getImageCompactModeStyle: GetImageCompactModeStyle = (maxWidth) => ({
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    width: '100%',
    height: 'auto',
    maxWidth,
    minHeight: 0,
    alignSelf: 'center',
});

export default getImageCompactModeStyle;
