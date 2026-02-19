import CONST from '@src/CONST';
import type GetCompactReceiptDimensions from './types';

const getCompactReceiptDimensions: GetCompactReceiptDimensions = ({windowWidth, horizontalMargin, containerWidth, aspectRatio}) => {
    const maxWidth = CONST.IOU.COMPACT_RECEIPT.MAX_WIDTH;
    const availableWidth = Math.max(windowWidth - horizontalMargin * 2, 0);
    const compactReceiptMaxWidth = Math.min(maxWidth, availableWidth || maxWidth);
    const compactReceiptAspectRatio = aspectRatio && aspectRatio > 0 ? aspectRatio : CONST.IOU.COMPACT_RECEIPT.DEFAULT_ASPECT_RATIO;
    const effectiveCompactReceiptWidth = containerWidth > 0 ? containerWidth : compactReceiptMaxWidth;
    const compactReceiptMaxHeight = Math.max(Math.round(effectiveCompactReceiptWidth / compactReceiptAspectRatio) - CONST.IOU.COMPACT_RECEIPT.MAX_HEIGHT_PIXEL_ADJUSTMENT, 0);

    return {
        compactReceiptMaxWidth,
        compactReceiptMaxHeight,
    };
};

export default getCompactReceiptDimensions;
