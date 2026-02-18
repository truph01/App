import {useMemo} from 'react';
import {buildFeedKeysWithAssignedCards} from '@selectors/Card';
import ONYXKEYS from '@src/ONYXKEYS';
import useOnyx from './useOnyx';

type FeedKeysWithAssignedCards = Record<string, true>;

function useFeedKeysWithAssignedCards(): FeedKeysWithAssignedCards | undefined {
    const [allWorkspaceCards] = useOnyx(ONYXKEYS.COLLECTION.WORKSPACE_CARDS_LIST, {canBeMissing: true});

    return useMemo(() => buildFeedKeysWithAssignedCards(allWorkspaceCards), [allWorkspaceCards]);
}

export default useFeedKeysWithAssignedCards;
export type {FeedKeysWithAssignedCards};
