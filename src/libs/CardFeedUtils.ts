import type {OnyxCollection} from 'react-native-onyx';
import type {LocaleContextProps, LocalizedTranslate} from '@components/LocaleContextProvider';
import type {AdditionalCardProps} from '@components/Search/SearchList/ListItem/CardListItem';
import type {FeedKeysWithAssignedCards} from '@hooks/useFeedKeysWithAssignedCards';
import type IllustrationsType from '@styles/theme/illustrations/types';
import CONST from '@src/CONST';
import type {CombinedCardFeeds} from '@src/hooks/useCardFeeds';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Card, CardFeeds, CardList, PersonalDetailsList, Policy, WorkspaceCardsList} from '@src/types/onyx';
import type {CardFeedsStatus, CardFeedsStatusByDomainID, CardFeedWithNumber, CombinedCardFeed} from '@src/types/onyx/CardFeeds';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import {
    feedHasCards,
    getBankName,
    getCardFeedIcon,
    getCardFeedWithDomainID,
    getCustomOrFormattedFeedName,
    getOriginalCompanyFeeds,
    getPlaidInstitutionIconUrl,
    getPlaidInstitutionId,
    isCard,
    isCardClosed,
    isCardHiddenFromSearch,
    isCSVUploadFeed,
    isCustomFeed,
    isDirectFeed,
    isPersonalCard,
} from './CardUtils';
import type {CompanyCardFeedIcons} from './CardUtils';
import {getDescriptionForPolicyDomainCard} from './PolicyUtils';
import type {OptionData} from './ReportUtils';

type CardFilterItem = Partial<OptionData> & AdditionalCardProps & {isCardFeed?: boolean; correspondingCards?: string[]; cardFeedKey: string; plaidUrl?: string; keyForList: string};
type DomainFeedData = {bank: CardFeedWithNumber; domainName: string; correspondingCardIDs: string[]; fundID?: string; country?: string};
type ItemsGroupedBySelection = {selected: CardFilterItem[]; unselected: CardFilterItem[]};
type CardFeedNamesWithType = Record<string, {name: string; type: 'domain' | 'workspace'}>;
type CardFeedData = {cardName: string; bank: CardFeedWithNumber; label?: string; type: 'domain' | 'workspace'; country?: string};
type GetCardFeedData = {
    workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined> | undefined;
    translate: LocaleContextProps['translate'];
    policies: OnyxCollection<Policy>;
};
type CardFeedForDisplay = {
    id: string;
    feed: CardFeedWithNumber;
    fundID: string;
    name: string;
    country?: string;
    linkedPolicyIDs?: string[];
};
type CardFeedsForDisplay = Record<string, CardFeedForDisplay>;

function getRepeatingBanks(workspaceCardFeedsKeys: string[], domainFeedsData: Record<string, DomainFeedData>) {
    const bankFrequency: Record<string, number> = {};
    for (const key of workspaceCardFeedsKeys) {
        // Example: "cards_18755165_Expensify Card" -> "Expensify Card"
        const bankName = key.split('_').at(2);
        if (bankName) {
            bankFrequency[bankName] = (bankFrequency[bankName] || 0) + 1;
        }
    }
    for (const domainFeed of Object.values(domainFeedsData)) {
        bankFrequency[domainFeed.bank] = (bankFrequency[domainFeed.bank] || 0) + 1;
    }
    return Object.keys(bankFrequency).filter((bank) => bankFrequency[bank] > 1);
}

/**
 * @returns string with the 'cards_' part removed from the beginning
 */
function getCardFeedKey(workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined> | undefined, workspaceFeedKey: string) {
    const workspaceFeed = workspaceCardFeeds ? workspaceCardFeeds[workspaceFeedKey] : undefined;
    if (!workspaceFeed) {
        return;
    }
    const representativeCard = Object.values(workspaceFeed).find((cardFeedItem) => isCard(cardFeedItem));
    if (!representativeCard) {
        return;
    }
    const {fundID, bank} = representativeCard;
    const country = bank === CONST.EXPENSIFY_CARD.BANK ? getFeedCountryForDisplay(representativeCard.nameValuePairs?.feedCountry) : '';
    return createCardFeedKey(fundID, bank, country);
}

/**
 * @returns string with added 'cards_' substring at the beginning
 */
function getWorkspaceCardFeedKey(cardFeedKey: string) {
    if (!cardFeedKey.startsWith(ONYXKEYS.COLLECTION.WORKSPACE_CARDS_LIST)) {
        return `${ONYXKEYS.COLLECTION.WORKSPACE_CARDS_LIST}${cardFeedKey}`;
    }
    return cardFeedKey;
}

/**
 * Resolves the display name of a linked policy when preferredPolicy differs from the current policyID.
 */
function getLinkedPolicyName(allPolicies: OnyxCollection<Policy>, preferredPolicy: string | undefined, currentPolicyID: string, fallbackName: string | undefined): string | undefined {
    if (preferredPolicy && preferredPolicy !== currentPolicyID) {
        return allPolicies?.[`${ONYXKEYS.COLLECTION.POLICY}${preferredPolicy}`]?.name ?? fallbackName;
    }
    return fallbackName;
}

function createCardFilterItem(
    card: Card,
    personalDetailsList: PersonalDetailsList,
    selectedCards: string[],
    illustrations: IllustrationsType,
    companyCardIcons: CompanyCardFeedIcons,
    customCardNames?: Record<string, string>,
): CardFilterItem {
    const personalDetails = personalDetailsList[card?.accountID ?? CONST.DEFAULT_NUMBER_ID];
    const isSelected = selectedCards.includes(card.cardID.toString());
    const icon = getCardFeedIcon(card?.bank, illustrations, companyCardIcons);
    let cardName = card?.nameValuePairs?.cardTitle;
    const text = personalDetails?.displayName ?? cardName;
    const plaidUrl = getPlaidInstitutionIconUrl(card?.bank);
    const isCSVImportCard = card?.bank === CONST.PERSONAL_CARDS.BANK_NAME.CSV;
    const isPersonal = isPersonalCard(card);
    if (isPersonal && !isCSVImportCard) {
        cardName = customCardNames?.[card?.cardID] ?? card?.cardName;
    }

    return {
        lastFourPAN: isCSVImportCard ? card?.cardName : card.lastFourPAN,
        isVirtual: card?.nameValuePairs?.isVirtual,
        shouldShowOwnersAvatar: true,
        cardName,
        cardOwnerPersonalDetails: personalDetails ?? undefined,
        text,
        plaidUrl,
        keyForList: card.cardID.toString(),
        isSelected,
        bankIcon: {
            icon,
        },
        isCardFeed: false,
        cardFeedKey: '',
    };
}

function buildCardsData(
    workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined>,
    userCardList: CardList,
    personalDetailsList: PersonalDetailsList,
    selectedCards: string[],
    illustrations: IllustrationsType,
    companyCardIcons: CompanyCardFeedIcons,
    isClosedCards = false,
    customCardNames?: Record<string, string>,
): ItemsGroupedBySelection {
    // Filter condition to build different cards data for closed cards and individual cards based on the isClosedCards flag, we don't want to show closed cards in the individual cards section
    const filterCondition = (card: Card) => (isClosedCards ? isCardClosed(card) : !isCardHiddenFromSearch(card) && !isCardClosed(card) && isCard(card));
    const userAssignedCards: CardFilterItem[] = Object.values(userCardList ?? {})
        .filter((card) => filterCondition(card))
        .map((card) => createCardFilterItem(card, personalDetailsList, selectedCards, illustrations, companyCardIcons, customCardNames));

    // When user is admin of a workspace he sees all the cards of workspace under cards_ Onyx key
    const allWorkspaceCards: CardFilterItem[] = Object.values(workspaceCardFeeds)
        .filter((cardFeed) => !isEmptyObject(cardFeed))
        .flatMap((cardFeed) => {
            return Object.values(cardFeed as CardList)
                .filter((card) => card && isCard(card) && !userCardList?.[card.cardID] && filterCondition(card))
                .map((card) => createCardFilterItem(card, personalDetailsList, selectedCards, illustrations, companyCardIcons, customCardNames));
        });

    const allCardItems = [...userAssignedCards, ...allWorkspaceCards];
    const selectedCardItems: CardFilterItem[] = [];
    const unselectedCardItems: CardFilterItem[] = [];
    for (const card of allCardItems) {
        if (card.isSelected) {
            selectedCardItems.push(card);
        } else {
            unselectedCardItems.push(card);
        }
    }
    return {selected: selectedCardItems, unselected: unselectedCardItems};
}

/**
 * @param cardList - The list of cards to process. Can be undefined.
 * @returns a record where keys are domain names and values contain domain feed data.
 */
function generateDomainFeedData(cardList: CardList | undefined): Record<string, DomainFeedData> {
    return Object.values(cardList ?? {}).reduce(
        (domainFeedData, currentCard) => {
            // Cards in cardList can also be domain cards, we use them to compute domain feed
            if (!currentCard?.domainName?.match(CONST.REGEX.EXPENSIFY_POLICY_DOMAIN_NAME) && !isCardHiddenFromSearch(currentCard) && currentCard.fundID) {
                // Expensify Card feeds are split per country so the picker shows one entry per program (US/GB/TRAVEL_US).
                // Non-Expensify feeds keep the legacy 2-segment key.
                const country = currentCard.bank === CONST.EXPENSIFY_CARD.BANK ? getFeedCountryForDisplay(currentCard.nameValuePairs?.feedCountry) : '';
                const key = createCardFeedKey(currentCard.fundID, currentCard.bank, country);
                if (domainFeedData[key]) {
                    domainFeedData[key].correspondingCardIDs.push(currentCard.cardID.toString());
                } else {
                    // if the cards belongs to the same domain, every card of it should have the same fundID
                    // eslint-disable-next-line no-param-reassign
                    domainFeedData[key] = {
                        fundID: currentCard.fundID,
                        domainName: currentCard.domainName,
                        bank: currentCard?.bank,
                        correspondingCardIDs: [currentCard.cardID?.toString()],
                        ...(country ? {country} : {}),
                    };
                }
            }
            return domainFeedData;
        },
        {} as Record<string, DomainFeedData>,
    );
}

function getDomainFeedData(workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined> | undefined) {
    const flattenedWorkspaceCardFeeds = Object.values(workspaceCardFeeds ?? {}).reduce<CardList>((result, domainCards) => {
        Object.assign(result, domainCards);
        return result;
    }, {});
    return generateDomainFeedData(flattenedWorkspaceCardFeeds);
}

function getWorkspaceCardFeedData(
    cardFeed: WorkspaceCardsList | undefined,
    policies: OnyxCollection<Policy>,
    repeatingBanks: string[],
    translate: LocaleContextProps['translate'],
): CardFeedData | undefined {
    const cardFeedArray = Object.values(cardFeed ?? {});
    const representativeCard = cardFeedArray.find((cardFeedItem) => isCard(cardFeedItem));
    if (!representativeCard || !cardFeedArray.some((cardFeedItem) => isCard(cardFeedItem) && !isCardHiddenFromSearch(cardFeedItem))) {
        return;
    }
    const {domainName, bank, cardName} = representativeCard;
    const isBankRepeating = repeatingBanks.includes(bank);
    const policyID = domainName.match(CONST.REGEX.EXPENSIFY_POLICY_DOMAIN_NAME)?.[1] ?? '';
    const correspondingPolicy = policies?.[`${ONYXKEYS.COLLECTION.POLICY}${policyID?.toUpperCase()}`];
    const cardFeedLabel = isBankRepeating ? correspondingPolicy?.name : undefined;
    const isPlaid = !!getPlaidInstitutionId(bank);
    const companyCardBank = isPlaid && cardName ? cardName : getBankName(bank);

    const country = bank === CONST.EXPENSIFY_CARD.BANK ? getFeedCountryForDisplay(representativeCard.nameValuePairs?.feedCountry) : '';
    const cardFeedBankName = bank === CONST.EXPENSIFY_CARD.BANK ? translate('search.filters.card.expensify') : companyCardBank;
    const fullCardName =
        cardFeedBankName === CONST.COMPANY_CARDS.CARD_TYPE.CSV
            ? translate('search.filters.card.cardFeedNameCSV', {cardFeedLabel})
            : translate('search.filters.card.cardFeedName', {cardFeedBankName, cardFeedLabel, country});

    return {
        cardName: fullCardName,
        bank,
        label: cardFeedLabel,
        type: 'workspace',
        ...(country ? {country} : {}),
    };
}

function getDomainCardFeedData(domainFeed: DomainFeedData, policies: OnyxCollection<Policy>, repeatingBanks: string[], translate: LocaleContextProps['translate']): CardFeedData {
    const {domainName, bank, country} = domainFeed;
    const isBankRepeating = repeatingBanks.includes(bank);
    const cardFeedBankName = bank === CONST.EXPENSIFY_CARD.BANK ? translate('search.filters.card.expensify') : getBankName(bank);
    const cardFeedLabel = isBankRepeating ? getDescriptionForPolicyDomainCard(domainName, policies) : undefined;
    const cardName =
        cardFeedBankName === CONST.COMPANY_CARDS.CARD_TYPE.CSV
            ? translate('search.filters.card.cardFeedNameCSV', {cardFeedLabel})
            : translate('search.filters.card.cardFeedName', {cardFeedBankName, cardFeedLabel, country});
    return {
        cardName,
        bank,
        label: cardFeedLabel,
        type: 'domain',
        ...(country ? {country} : {}),
    };
}

function filterOutDomainCards(workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined> | undefined) {
    const domainFeedData = getDomainFeedData(workspaceCardFeeds);
    // Expensify Card domain keys are now `<fundID>_<bank>_<country>`, so a plain `<fundID>_<bank>`
    // reconstruction misses them. Strip the country segment off the domain key when checking
    // membership so workspace feeds still get deduplicated against their domain counterpart.
    const domainKeysWithoutCountry = new Set(Object.values(domainFeedData).map((domainFeed) => `${domainFeed.fundID}_${domainFeed.bank}`));
    return Object.entries(workspaceCardFeeds ?? {}).filter(([, workspaceFeed]) => {
        const domainFeed = Object.values(workspaceFeed ?? {}).at(0) ?? {};
        if (domainKeysWithoutCountry.has(`${domainFeed.fundID}_${domainFeed.bank}`)) {
            return false;
        }
        return !isEmptyObject(workspaceFeed);
    });
}

function getCardFeedsData({workspaceCardFeeds, policies, translate}: GetCardFeedData) {
    const domainFeedData = getDomainFeedData(workspaceCardFeeds);
    const repeatingBanks = getRepeatingBanks(Object.keys(workspaceCardFeeds ?? CONST.EMPTY_OBJECT), domainFeedData);
    const cardFeedData: Record<string, CardFeedData> = {};

    for (const [cardFeedKey, cardFeed] of filterOutDomainCards(workspaceCardFeeds)) {
        const workspaceData = getWorkspaceCardFeedData(cardFeed, policies, repeatingBanks, translate);
        if (workspaceData) {
            cardFeedData[cardFeedKey] = workspaceData;
        }
    }

    for (const domainFeed of Object.values(domainFeedData)) {
        const cardFeedKey = createCardFeedKey(`cards_${domainFeed.fundID}`, domainFeed.bank, domainFeed.country);
        cardFeedData[cardFeedKey] = getDomainCardFeedData(domainFeed, policies, repeatingBanks, translate);
    }

    return cardFeedData;
}

function getCardFeedNamesWithType(params: GetCardFeedData) {
    const cardFeedData = getCardFeedsData(params);
    return Object.keys(cardFeedData).reduce<CardFeedNamesWithType>((cardFeedNamesWithType, cardFeedKey) => {
        /* eslint-disable-next-line no-param-reassign */
        cardFeedNamesWithType[cardFeedKey] = {
            name: cardFeedData[cardFeedKey].cardName,
            type: cardFeedData[cardFeedKey].type,
        };
        return cardFeedNamesWithType;
    }, {});
}

function createCardFeedKey(fundID: string | undefined, bank: string, country?: string) {
    if (!fundID) {
        return bank;
    }
    if (country) {
        return `${fundID}_${bank}_${country}`;
    }
    return `${fundID}_${bank}`;
}

function createCardFeedItem({
    cardName,
    bank,
    keyForList,
    cardFeedKey,
    correspondingCardIDs,
    selectedCards,
    illustrations,
    companyCardIcons,
}: {
    cardName: string;
    bank: CardFeedWithNumber;
    keyForList: string;
    cardFeedKey: string;
    correspondingCardIDs: string[];
    selectedCards: string[];
    illustrations: IllustrationsType;
    companyCardIcons: CompanyCardFeedIcons;
}): CardFilterItem {
    const isSelected = correspondingCardIDs.every((card) => selectedCards.includes(card));
    const plaidUrl = getPlaidInstitutionIconUrl(bank);

    const icon = getCardFeedIcon(bank, illustrations, companyCardIcons);
    return {
        text: cardName,
        keyForList,
        isSelected,
        shouldShowOwnersAvatar: false,
        bankIcon: {
            icon,
        },
        plaidUrl,
        cardFeedKey,
        isCardFeed: true,
        correspondingCards: correspondingCardIDs,
    };
}

function buildCardFeedsData(
    workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined>,
    domainFeedsData: Record<string, DomainFeedData>,
    policies: OnyxCollection<Policy>,
    selectedCards: string[],
    translate: LocaleContextProps['translate'],
    illustrations: IllustrationsType,
    companyCardIcons: CompanyCardFeedIcons,
): ItemsGroupedBySelection {
    const selectedFeeds: CardFilterItem[] = [];
    const unselectedFeeds: CardFilterItem[] = [];
    const repeatingBanks = getRepeatingBanks(Object.keys(workspaceCardFeeds), domainFeedsData);

    for (const domainFeed of Object.values(domainFeedsData)) {
        const {domainName, bank, correspondingCardIDs, country} = domainFeed;

        const cardFeedKey = createCardFeedKey(domainFeed.fundID, bank, country);
        const {cardName} = getDomainCardFeedData(domainFeed, policies, repeatingBanks, translate);

        const feedItem = createCardFeedItem({
            cardName,
            bank,
            correspondingCardIDs,
            keyForList: country ? `${domainName}-${bank}-${country}` : `${domainName}-${bank}`,
            cardFeedKey,
            selectedCards,
            illustrations,
            companyCardIcons,
        });
        if (feedItem.isSelected) {
            selectedFeeds.push(feedItem);
        } else {
            unselectedFeeds.push(feedItem);
        }
    }

    for (const [workspaceFeedKey, workspaceFeed] of filterOutDomainCards(workspaceCardFeeds)) {
        const correspondingCardIDs = Object.entries(workspaceFeed ?? {})
            .filter(([cardKey, card]) => cardKey !== 'cardList' && isCard(card) && !isCardHiddenFromSearch(card))
            .map(([cardKey]) => cardKey);

        const cardFeedData = getWorkspaceCardFeedData(workspaceFeed, policies, repeatingBanks, translate);
        if (!cardFeedData) {
            continue;
        }
        const {cardName, bank} = cardFeedData;
        const cardFeedKey = getCardFeedKey(workspaceCardFeeds, workspaceFeedKey);

        const feedItem = createCardFeedItem({
            cardName,
            bank,
            correspondingCardIDs,
            cardFeedKey: cardFeedKey ?? '',
            keyForList: workspaceFeedKey,
            selectedCards,
            illustrations,
            companyCardIcons,
        });
        if (feedItem.isSelected) {
            selectedFeeds.push(feedItem);
        } else {
            unselectedFeeds.push(feedItem);
        }
    }

    return {selected: selectedFeeds, unselected: unselectedFeeds};
}

function getSelectedCardsFromFeeds(cards: CardList | undefined, workspaceCardFeeds?: Record<string, WorkspaceCardsList | undefined>, selectedFeeds?: string[]): string[] {
    const domainFeedsData = generateDomainFeedData(cards);
    const domainFeedCards: Record<string, string[]> = {};
    // Buckets keyed by the 2-segment `<fundID>_<bank>` let a legacy saved filter resolve to every
    // country bucket for that fundID. Populated only for Expensify Card feeds where the canonical
    // key is now 3-segment.
    const domainFeedCardsByFundBank: Record<string, string[]> = {};
    for (const domainFeedData of Object.values(domainFeedsData)) {
        const key = createCardFeedKey(domainFeedData.fundID, domainFeedData.bank, domainFeedData.country);
        domainFeedCards[key] = domainFeedData.correspondingCardIDs;
        if (domainFeedData.country) {
            const legacyKey = `${domainFeedData.fundID}_${domainFeedData.bank}`;
            (domainFeedCardsByFundBank[legacyKey] ||= []).push(...domainFeedData.correspondingCardIDs);
        }
    }

    if (!workspaceCardFeeds || !selectedFeeds) {
        return [];
    }

    const selectedCards = selectedFeeds.flatMap((cardFeedKey) => {
        const workspaceCardFeed = workspaceCardFeeds[getWorkspaceCardFeedKey(cardFeedKey)];
        if (!workspaceCardFeed) {
            if (!cards || Object.keys(domainFeedCards).length === 0) {
                return [];
            }

            // Legacy 2-segment selection (e.g. saved filter predating the country split) — union
            // every country bucket on the same `<fundID>_<bank>`.
            const legacyBucket = domainFeedCardsByFundBank[cardFeedKey];
            if (legacyBucket && !domainFeedCards[cardFeedKey]) {
                return legacyBucket.filter((cardNumber) => cards[cardNumber].state !== CONST.EXPENSIFY_CARD.STATE.STATE_NOT_ISSUED);
            }

            if (!domainFeedCards[cardFeedKey]) {
                return [];
            }

            return domainFeedCards[cardFeedKey].filter((cardNumber) => cards[cardNumber].state !== CONST.EXPENSIFY_CARD.STATE.STATE_NOT_ISSUED);
        }

        return Object.keys(workspaceCardFeed).filter((cardNumber) => workspaceCardFeed[cardNumber].state !== CONST.EXPENSIFY_CARD.STATE.STATE_NOT_ISSUED);
    });

    return [...new Set(selectedCards)];
}

const generateSelectedCards = (
    cardList: CardList | undefined,
    workspaceCardFeeds: Record<string, WorkspaceCardsList | undefined> | undefined,
    feeds: string[] | undefined,
    cards: string[] | undefined,
) => {
    const selectedCards = getSelectedCardsFromFeeds(cardList, workspaceCardFeeds, feeds);
    return [...new Set([...selectedCards, ...(cards ?? [])])];
};

/**
 * Maps a stored `feedCountry` value to the wire-level country segment used in the Search feed
 * filter token. Pre-2024 `CURRENT` collapses to `US` so users see one "US" picker entry covering
 * both legacy and 2025 Expensify Card programs; Auth expands `US` back to `IN ('US','CURRENT')`.
 * Returns an empty string when the card has no feedCountry or carries an unrecognised value —
 * those entries keep the legacy 2-segment token, which Auth still parses without a country
 * predicate (matches all Expensify Cards on the fundID regardless of program).
 */
function getFeedCountryForDisplay(feedCountry: string | undefined): string {
    switch (feedCountry) {
        case CONST.EXPENSIFY_CARD.CARD_PROGRAM.CURRENT:
        case CONST.COUNTRY.US:
            return CONST.COUNTRY.US;
        case CONST.COUNTRY.GB:
            return CONST.COUNTRY.GB;
        case CONST.TRAVEL.PROGRAM_TRAVEL_US:
            return CONST.TRAVEL.PROGRAM_TRAVEL_US;
        default:
            return '';
    }
}

function getExpensifyCardFeedsForDisplay(allCards: CardList | undefined): CardFeedsForDisplay {
    const result = {} as CardFeedsForDisplay;

    for (const card of Object.values(allCards ?? {})) {
        if (card.bank !== CONST.EXPENSIFY_CARD.BANK || !card.fundID) {
            continue;
        }

        const country = getFeedCountryForDisplay(card.nameValuePairs?.feedCountry);
        const id = country ? `${card.fundID}_${CONST.EXPENSIFY_CARD.BANK}_${country}` : `${card.fundID}_${CONST.EXPENSIFY_CARD.BANK}`;

        if (result[id]) {
            continue;
        }

        result[id] = {
            id,
            feed: CONST.EXPENSIFY_CARD.BANK,
            fundID: card.fundID,
            name: CONST.EXPENSIFY_CARD.BANK,
            ...(country ? {country} : {}),
        };
    }

    return result;
}

/**
 * Given a collection of card feeds, return formatted card feeds.
 *
 * The `allCards` parameter is only used to determine if we should add the "Expensify Card" feeds.
 */
function getCardFeedsForDisplay(
    allCardFeeds: OnyxCollection<CardFeeds>,
    allCards: CardList | undefined,
    translate: LocalizedTranslate,
    feedKeysWithCards?: FeedKeysWithAssignedCards,
): CardFeedsForDisplay {
    const cardFeedsForDisplay = {} as CardFeedsForDisplay;

    for (const [domainKey, cardFeeds] of Object.entries(allCardFeeds ?? {})) {
        // sharedNVP_private_domain_member_123456 -> 123456
        const fundID = domainKey.split('_').at(-1);
        if (!fundID) {
            continue;
        }

        for (const key of Object.keys(getOriginalCompanyFeeds(cardFeeds, feedKeysWithCards, Number(fundID)))) {
            const feed = key as CardFeedWithNumber;
            const id = `${fundID}_${feed}`;

            if (cardFeedsForDisplay[id]) {
                continue;
            }

            cardFeedsForDisplay[id] = {
                id,
                feed,
                fundID,
                name: getCustomOrFormattedFeedName(translate, feed, cardFeeds?.settings?.companyCardNicknames?.[feed], false) ?? feed,
            };
        }
    }

    Object.assign(cardFeedsForDisplay, getExpensifyCardFeedsForDisplay(allCards));

    return cardFeedsForDisplay;
}

/**
 * Given a collection of card feeds, return formatted card feeds grouped per policy.
 *
 * Note: "Expensify Card" feeds are not included.
 */
function getCardFeedsForDisplayPerPolicy(
    allCardFeeds: OnyxCollection<CardFeeds>,
    translate: LocalizedTranslate,
    feedKeysWithCards?: FeedKeysWithAssignedCards,
): Record<string, CardFeedForDisplay[]> {
    const cardFeedsForDisplayPerPolicy = {} as Record<string, CardFeedForDisplay[]>;

    for (const [domainKey, cardFeeds] of Object.entries(allCardFeeds ?? {})) {
        // sharedNVP_private_domain_member_123456 -> 123456
        const fundID = domainKey.split('_').at(-1);
        if (!fundID) {
            continue;
        }

        for (const [key, feedData] of Object.entries(getOriginalCompanyFeeds(cardFeeds, feedKeysWithCards, Number(fundID)))) {
            const preferredPolicy = feedData && 'preferredPolicy' in feedData ? (feedData.preferredPolicy ?? '') : '';
            const country = feedData && 'country' in feedData ? (feedData.country ?? '') : '';
            const linkedPolicyIDs = feedData && 'linkedPolicyIDs' in feedData ? feedData.linkedPolicyIDs : undefined;
            const feed = key as CardFeedWithNumber;
            const id = `${fundID}_${feed}`;

            (cardFeedsForDisplayPerPolicy[preferredPolicy] ||= []).push({
                id,
                feed,
                country,
                fundID,
                linkedPolicyIDs,
                name: getCustomOrFormattedFeedName(translate, feed, cardFeeds?.settings?.companyCardNicknames?.[feed], false) ?? feed,
            });
        }
    }

    return cardFeedsForDisplayPerPolicy;
}

/**
 * Finds a feed by id in the card feeds grouped by policy.
 *
 * @param feedId - The feed id (e.g. `${fundID}_${feed}`) to look up
 * @param cardFeedsByPolicy - Card feeds per policy from getCardFeedsForDisplayPerPolicy
 * @returns The matching CardFeedForDisplay or undefined
 */
function getFeedInfo(feedId: string, cardFeedsByPolicy?: Record<string, CardFeedForDisplay[]>): CardFeedForDisplay | undefined {
    if (!feedId || !cardFeedsByPolicy) {
        return undefined;
    }
    for (const cardFeeds of Object.values(cardFeedsByPolicy)) {
        const found = cardFeeds.find((item) => item.id === feedId);
        if (found) {
            return found;
        }
    }
    return undefined;
}

function getCardFeedStatus(feed: CardFeeds | undefined): CardFeedsStatus {
    return {
        errors: feed?.errors,
        isLoading: feed?.isLoading,
    };
}

function getWorkspaceCardFeedsStatus(allFeeds: OnyxCollection<CardFeeds> | undefined): CardFeedsStatusByDomainID {
    return Object.entries(allFeeds ?? {}).reduce<CardFeedsStatusByDomainID>((acc, [onyxKey, feeds]) => {
        const domainID = Number(onyxKey.split('_').at(-1));
        acc[domainID] = getCardFeedStatus(feeds);
        return acc;
    }, {} as CardFeedsStatusByDomainID);
}

function getCombinedCardFeedsFromAllFeeds(
    allFeeds: OnyxCollection<CardFeeds> | undefined,
    includeFeedPredicate?: (feed: CombinedCardFeed) => boolean,
    feedKeysWithCards?: FeedKeysWithAssignedCards,
): CombinedCardFeeds {
    return Object.entries(allFeeds ?? {}).reduce<CombinedCardFeeds>((acc, [onyxKey, feeds]) => {
        const domainID = Number(onyxKey.split('_').at(-1));

        const workspaceFeedsSettings = feeds?.settings;
        const companyCards = workspaceFeedsSettings?.companyCards;

        if (!companyCards) {
            return acc;
        }

        for (const feedName of Object.keys(companyCards) as CardFeedWithNumber[]) {
            const feedSettings = companyCards?.[feedName];
            const oAuthAccountDetails = workspaceFeedsSettings?.oAuthAccountDetails?.[feedName];
            const customFeedName = workspaceFeedsSettings?.companyCardNicknames?.[feedName];
            const status = workspaceFeedsSettings?.cardFeedsStatus?.[feedName];

            if (!domainID) {
                continue;
            }

            // When we have card data, filter out stale feeds:
            // - Direct feeds without oAuthAccountDetails AND no assigned cards
            // - "Gray zone" feeds (not commercial, not direct, not CSV upload) without assigned cards
            // CSV upload feeds are always shown when they exist in settings, since their
            // unassigned cards are loaded on-demand when the feed is selected.
            if (feedKeysWithCards) {
                if (isDirectFeed(feedName) && !oAuthAccountDetails && !feedHasCards(feedName, domainID, feedKeysWithCards)) {
                    continue;
                }
                if (!isCustomFeed(feedName) && !isDirectFeed(feedName) && !isCSVUploadFeed(feedName) && !feedHasCards(feedName, domainID, feedKeysWithCards)) {
                    continue;
                }
            }

            const combinedCardFeed: CombinedCardFeed = {
                ...feedSettings,
                ...oAuthAccountDetails,
                customFeedName: customFeedName ?? feedSettings?.uploadLayoutSettings?.layoutName,
                domainID,
                feed: feedName,
                status,
            };

            if (includeFeedPredicate && !includeFeedPredicate(combinedCardFeed)) {
                continue;
            }

            const combinedFeedKey = getCardFeedWithDomainID(feedName, domainID);

            acc[combinedFeedKey] = combinedCardFeed;
        }

        return acc;
    }, {});
}

export type {CardFilterItem, CardFeedNamesWithType, CardFeedForDisplay};
export type {DomainFeedData};
export {
    buildCardsData,
    getCardFeedNamesWithType,
    buildCardFeedsData,
    generateSelectedCards,
    getSelectedCardsFromFeeds,
    createCardFeedKey,
    getCardFeedKey,
    getWorkspaceCardFeedKey,
    getFeedInfo,
    getLinkedPolicyName,
    generateDomainFeedData,
    getDomainFeedData,
    getCardFeedsForDisplay,
    getExpensifyCardFeedsForDisplay,
    getCardFeedsForDisplayPerPolicy,
    getCombinedCardFeedsFromAllFeeds,
    getCardFeedStatus,
    getWorkspaceCardFeedsStatus,
    getFeedCountryForDisplay,
};
