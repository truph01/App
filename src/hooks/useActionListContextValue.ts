import {useRef, useState} from 'react';
import type {FlatList} from 'react-native';
import type {ActionListContextType, ScrollPosition} from '@pages/inbox/ReportScreenContext';

function useActionListContextValue(): ActionListContextType {
    const flatListRef = useRef<FlatList>(null);
    const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({});
    const scrollOffsetRef = useRef(0);

    return {flatListRef, scrollPosition, setScrollPosition, scrollOffsetRef};
}

export default useActionListContextValue;
