import type {ReactNode} from 'react';

export type DragAndDropProviderProps = {
    /** Children to render inside this component. */
    children: ReactNode;

    /** Should this dropZone be disabled? */
    isDisabled?: boolean;

    /** Indicate that users are dragging file or not */
    setIsDraggingOver?: (value: boolean) => void;
};

export type SetOnDropHandlerCallback = (event: DragEvent) => void;

export type DragAndDropStateContextType = {
    /** Whether something is dragging over a drop zone. */
    isDraggingOver: boolean;

    /** Drop zone id for the portal host. */
    dropZoneID: string;
};

export type DragAndDropActionsContextType = {
    /** Register the callback to run when an item is dropped in the drop zone. */
    setOnDropHandler: (callback: SetOnDropHandlerCallback) => void;
};

/** @deprecated Use DragAndDropStateContextType and DragAndDropActionsContextType with hooks instead. */
export type DragAndDropContextParams = DragAndDropStateContextType & DragAndDropActionsContextType;
