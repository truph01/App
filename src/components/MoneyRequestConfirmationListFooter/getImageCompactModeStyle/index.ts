import type GetImageCompactModeStyle from './types';

const getImageCompactModeStyle: GetImageCompactModeStyle = (maxWidth) => ({
    flexBasis: 0,
    flexGrow: 1,
    width: '90%',
    height: 'auto',
    maxWidth,
    minHeight: 0,
    alignSelf: 'center',
});

export default getImageCompactModeStyle;
