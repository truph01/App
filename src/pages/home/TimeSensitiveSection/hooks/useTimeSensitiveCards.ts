import {useMemo} from 'react';
import useOnyx from '@hooks/useOnyx';
import {isCard, isCardPendingActivate, isCardPendingIssue, isCardWithPotentialFraud, isExpensifyCard} from '@libs/CardUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Card} from '@src/types/onyx';

function useTimeSensitiveCards() {
    const [cards] = useOnyx(ONYXKEYS.CARD_LIST, {canBeMissing: true});

    const timeSensitiveCards = useMemo(() => {
        const result: {
            cardsNeedingShippingAddress: Card[];
            cardsNeedingActivation: Card[];
            cardsWithFraud: Card[];
        } = {
            cardsNeedingShippingAddress: [],
            cardsNeedingActivation: [],
            cardsWithFraud: [],
        };

        for (const card of Object.values(cards ?? {})) {
            if (!isCard(card)) {
                continue;
            }

            if (!isExpensifyCard(card)) {
                continue;
            }

            if (isCardWithPotentialFraud(card) && card.nameValuePairs?.possibleFraud?.fraudAlertReportID) {
                result.cardsWithFraud.push(card);
            }

            const isPhysicalCard = !card.nameValuePairs?.isVirtual;
            if (!isPhysicalCard) {
                continue;
            }

            if (isCardPendingIssue(card)) {
                result.cardsNeedingShippingAddress.push(card);
            }

            if (isCardPendingActivate(card)) {
                result.cardsNeedingActivation.push(card);
            }
        }

        return result;
    }, [cards]);

    const cardsNeedingShippingAddress = timeSensitiveCards.cardsNeedingShippingAddress;
    const cardsNeedingActivation = timeSensitiveCards.cardsNeedingActivation;
    const cardsWithFraud = timeSensitiveCards.cardsWithFraud;

    const shouldShowAddShippingAddress = cardsNeedingShippingAddress.length > 0;
    const shouldShowActivateCard = cardsNeedingActivation.length > 0;
    const shouldShowReviewCardFraud = cardsWithFraud.length > 0;

    return {
        shouldShowAddShippingAddress,
        shouldShowActivateCard,
        shouldShowReviewCardFraud,
        cardsNeedingShippingAddress,
        cardsNeedingActivation,
        cardsWithFraud,
    };
}

export default useTimeSensitiveCards;
