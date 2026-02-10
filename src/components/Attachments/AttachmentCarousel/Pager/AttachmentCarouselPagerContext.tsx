import React, {createContext, useContext} from 'react';
import type {AttachmentCarouselPagerActionsContextType, AttachmentCarouselPagerStateContextType} from './types';

const AttachmentCarouselPagerStateContext = createContext<AttachmentCarouselPagerStateContextType | null>(null);
const AttachmentCarouselPagerActionsContext = createContext<AttachmentCarouselPagerActionsContextType | null>(null);

type AttachmentCarouselPagerProviderProps = {
    state: AttachmentCarouselPagerStateContextType;
    actions: AttachmentCarouselPagerActionsContextType;
    children: React.ReactNode;
};

function AttachmentCarouselPagerProvider({state, actions, children}: AttachmentCarouselPagerProviderProps) {
    return (
        <AttachmentCarouselPagerStateContext.Provider value={state}>
            <AttachmentCarouselPagerActionsContext.Provider value={actions}>{children}</AttachmentCarouselPagerActionsContext.Provider>
        </AttachmentCarouselPagerStateContext.Provider>
    );
}

function useAttachmentCarouselPagerState(): AttachmentCarouselPagerStateContextType | null {
    return useContext(AttachmentCarouselPagerStateContext);
}

function useAttachmentCarouselPagerActions(): AttachmentCarouselPagerActionsContextType | null {
    return useContext(AttachmentCarouselPagerActionsContext);
}

export {
    AttachmentCarouselPagerActionsContext,
    AttachmentCarouselPagerProvider,
    AttachmentCarouselPagerStateContext,
    useAttachmentCarouselPagerActions,
    useAttachmentCarouselPagerState,
};
export type {
    AttachmentCarouselPagerActionsContextType,
    AttachmentCarouselPagerItems,
    AttachmentCarouselPagerStateContextType,
} from './types';
