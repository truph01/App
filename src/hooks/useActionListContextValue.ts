import {useMemo, useRef, useState} from 'react';
import type {FlatList} from 'react-native';
import type {ActionListContextType, ScrollPosition} from '@pages/inbox/ReportScreenContext';

function useActionListContextValue(): ActionListContextType {
    const flatListRef = useRef<FlatList>(null);
    const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({});
    const scrollOffsetRef = useRef(0);

    return useMemo(() => ({flatListRef, scrollPosition, setScrollPosition, scrollOffsetRef}), [scrollPosition]);
}

export default useActionListContextValue;
