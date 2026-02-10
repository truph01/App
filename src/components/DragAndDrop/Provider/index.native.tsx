import React from 'react';
import type {DragAndDropProviderProps} from './types';
import {DragAndDropActionsContext, DragAndDropStateContext} from './DragAndDropContext';
import {defaultDragAndDropActionsContextValue, defaultDragAndDropStateContextValue} from './default';

function DragAndDropProvider({children}: DragAndDropProviderProps) {
    return (
        <DragAndDropStateContext.Provider value={defaultDragAndDropStateContextValue}>
            <DragAndDropActionsContext.Provider value={defaultDragAndDropActionsContextValue}>{children}</DragAndDropActionsContext.Provider>
        </DragAndDropStateContext.Provider>
    );
}

export default DragAndDropProvider;
export {useDragAndDropActions, useDragAndDropState} from './DragAndDropContext';
