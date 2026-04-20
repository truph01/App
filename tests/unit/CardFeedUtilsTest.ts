/* eslint-disable @typescript-eslint/naming-convention */
import type {OnyxCollection} from 'react-native-onyx';
import {
    getCardFeedNamesWithType,
    getCardFeedsForDisplay,
    getCardFeedsForDisplayPerPolicy,
    getExpensifyCardFeedsForDisplay,
    getFeedInfo,
    getSelectedCardsFromFeeds,
} from '@libs/CardFeedUtils';
import CONST from '@src/CONST';
import IntlStore from '@src/languages/IntlStore';
import type {CardFeeds, CardList, CompanyCardFeed, WorkspaceCardsList} from '@src/types/onyx';
import {translateLocal} from '../utils/TestHelper';
import waitForBatchedUpdates from '../utils/waitForBatchedUpdates';

const fakeWorkspace: Record<string, WorkspaceCardsList> = {
    'cards_11111111_Expensify Card': {
        '11111111': {
            accountID: 11111111,
            lastUpdated: '2024-11-29',
            bank: 'Expensify Card',
            cardID: 11111111,
            cardName: '111111XXXXXX1111',
            domainName: 'expensify-policy1234567891011121.exfy',
            fraud: 'none',
            fundID: '11111111',
            lastFourPAN: '1234',
            lastScrape: '',
            lastScrapeResult: 200,
            scrapeMinDate: '',
            state: 3,
        },
        '22222222': {
            accountID: 22222222,
            lastUpdated: '2024-11-29',
            bank: 'Expensify Card',
            cardID: 22222222,
            cardName: '222222XXXXXX2222',
            domainName: 'expensify-policy1234567891011121.exfy',
            fraud: 'none',
            fundID: '11111111',
            lastFourPAN: '5678',
            lastScrape: '',
            lastScrapeResult: 200,
            scrapeMinDate: '',
            state: 3,
        },
    },
    'cards_22222222_Expensify Card': {
        '33333333': {
            accountID: 33333333,
            lastUpdated: '2024-11-29',
            bank: 'Expensify Card',
            cardID: 33333333,
            cardName: '333333XXXXXX3333',
            domainName: 'expensify-policy1234567891011121.exfy',
            fraud: 'none',
            fundID: '22222222',
            lastFourPAN: '9101',
            lastScrape: '',
            lastScrapeResult: 200,
            scrapeMinDate: '',
            state: 3,
        },
    },
};

const cardListMock = {
    '11223344': {
        state: 1,
        bank: 'vcf',
        fundID: '5555',
        lastFourPAN: '1234',
    },
    '10203040': {
        state: 1,
        bank: CONST.EXPENSIFY_CARD.BANK,
        fundID: '5555',
        lastFourPAN: '1234',
    },
} as unknown as CardList;

const cardFeedAmericaExpressMock = 'oauth.americanexpressfdx.com 1001' as CompanyCardFeed;
const cardFeedVisaMock = 'vcf' as CompanyCardFeed;
const cardFeedCitiBankMock = 'oauth.citibank.com' as CompanyCardFeed;
const cardFeedStripeMock = 'stripe' as CompanyCardFeed;
const cardFeedsMock: OnyxCollection<CardFeeds> = {
    sharedNVP_private_domain_member_1234: {
        settings: {
            companyCardNicknames: {
                [cardFeedVisaMock]: 'Custom feed name',
            },
            companyCards: {
                [cardFeedAmericaExpressMock]: {},
                [cardFeedVisaMock]: {preferredPolicy: 'AA1BB2CC3'},
                [cardFeedCitiBankMock]: {preferredPolicy: 'AA1BB2CC3'},
                [cardFeedStripeMock]: {preferredPolicy: 'XX1YY2ZZ3'},
            },
            oAuthAccountDetails: {
                [cardFeedAmericaExpressMock]: {accountList: ['CREDIT CARD...1234'], credentials: 'xxxxx', expiration: 1730998958},
                [cardFeedCitiBankMock]: {accountList: ['CREDIT CARD...5678'], credentials: 'xxxxx', expiration: 1730998958},
            },
        },
    },
};

describe('Card Feed Utils', () => {
    beforeAll(() => {
        IntlStore.load(CONST.LOCALES.EN);
        return waitForBatchedUpdates();
    });
    it('returns display name of workspace & domain cards', () => {
        const cardFeedNamesWithType = getCardFeedNamesWithType({workspaceCardFeeds: fakeWorkspace, policies: undefined, translate: translateLocal});
        expect(Object.keys(cardFeedNamesWithType).length).toBe(2);
        expect(Object.values(cardFeedNamesWithType).every((cardFeedName) => cardFeedName.name === 'All Expensify')).toBe(true);
    });

    it('returns feeds to selected cards', () => {
        const feeds = ['22222222_Expensify Card'];
        const selected = getSelectedCardsFromFeeds({}, fakeWorkspace, feeds);
        expect(selected.length).toBe(1);
        expect(selected.at(0)).toEqual('33333333');
    });

    it('returns empty object when workspaceCardFeeds is empty', () => {
        const names = getCardFeedNamesWithType({workspaceCardFeeds: {key: {}}, policies: undefined, translate: translateLocal});
        expect(names).toEqual({});
    });

    it('returns empty array when selectedFeeds contains a non-existent feed', () => {
        const feeds = ['99999999_Expensify Card'];
        const selected = getSelectedCardsFromFeeds({}, fakeWorkspace, feeds);
        expect(selected).toEqual([]);
    });

    it('returns card feeds for display with custom names', () => {
        const cardFeedsForDisplay = getCardFeedsForDisplay(cardFeedsMock, cardListMock, translateLocal);
        expect(cardFeedsForDisplay).toEqual({
            '5555_Expensify Card': {id: '5555_Expensify Card', fundID: '5555', feed: 'Expensify Card', name: 'Expensify Card'},
            '1234_oauth.americanexpressfdx.com 1001': {id: '1234_oauth.americanexpressfdx.com 1001', fundID: '1234', feed: 'oauth.americanexpressfdx.com 1001', name: 'American Express'},
            '1234_vcf': {id: '1234_vcf', fundID: '1234', feed: 'vcf', name: 'Custom feed name'},
            '1234_oauth.citibank.com': {id: '1234_oauth.citibank.com', fundID: '1234', feed: 'oauth.citibank.com', name: 'Citibank'},
            '1234_stripe': {id: '1234_stripe', fundID: '1234', feed: 'stripe', name: 'Stripe'},
        });
    });

    it('returns card feeds for display without Expensify Card', () => {
        const cardFeedsForDisplay = getCardFeedsForDisplay(cardFeedsMock, {}, translateLocal);
        expect(cardFeedsForDisplay).toEqual({
            '1234_oauth.americanexpressfdx.com 1001': {id: '1234_oauth.americanexpressfdx.com 1001', fundID: '1234', feed: 'oauth.americanexpressfdx.com 1001', name: 'American Express'},
            '1234_vcf': {id: '1234_vcf', fundID: '1234', feed: 'vcf', name: 'Custom feed name'},
            '1234_oauth.citibank.com': {id: '1234_oauth.citibank.com', fundID: '1234', feed: 'oauth.citibank.com', name: 'Citibank'},
            '1234_stripe': {id: '1234_stripe', fundID: '1234', feed: 'stripe', name: 'Stripe'},
        });
    });

    it('returns card feeds grouped per policy', () => {
        const cardFeedsForDisplayPerPolicy = getCardFeedsForDisplayPerPolicy(cardFeedsMock, translateLocal);
        expect(cardFeedsForDisplayPerPolicy).toEqual({
            '': [
                {id: '1234_oauth.americanexpressfdx.com 1001', fundID: '1234', feed: 'oauth.americanexpressfdx.com 1001', name: 'American Express', linkedPolicyIDs: undefined, country: ''},
            ],
            AA1BB2CC3: [
                {id: '1234_vcf', fundID: '1234', feed: 'vcf', name: 'Custom feed name', linkedPolicyIDs: undefined, country: ''},
                {id: '1234_oauth.citibank.com', fundID: '1234', feed: 'oauth.citibank.com', name: 'Citibank', linkedPolicyIDs: undefined, country: ''},
            ],
            XX1YY2ZZ3: [{id: '1234_stripe', fundID: '1234', feed: 'stripe', name: 'Stripe', linkedPolicyIDs: undefined, country: ''}],
        });
    });

    it('returns card feeds with country when feed has country in company cards settings', () => {
        const cardFeedsWithCountry: OnyxCollection<CardFeeds> = {
            sharedNVP_private_domain_member_1234: {
                settings: {
                    companyCardNicknames: {},
                    companyCards: {
                        [cardFeedVisaMock]: {preferredPolicy: 'POL1', country: 'US'},
                    },
                },
            },
        };
        const result = getCardFeedsForDisplayPerPolicy(cardFeedsWithCountry, translateLocal);
        expect(result.POL1).toHaveLength(1);
        expect(result.POL1?.at(0)?.country).toBe('US');
        expect(result.POL1?.at(0)?.id).toBe('1234_vcf');
    });

    it('returns card feeds with linkedPolicyIDs when feed has linkedPolicyIDs in company cards settings', () => {
        const linkedPolicyIDs = ['POLICY_A', 'POLICY_B'];
        const cardFeedsWithLinkedPolicies: OnyxCollection<CardFeeds> = {
            sharedNVP_private_domain_member_1234: {
                settings: {
                    companyCardNicknames: {},
                    companyCards: {
                        [cardFeedStripeMock]: {preferredPolicy: 'POL2', linkedPolicyIDs},
                    },
                },
            },
        };
        const result = getCardFeedsForDisplayPerPolicy(cardFeedsWithLinkedPolicies, translateLocal);
        expect(result.POL2).toHaveLength(1);
        expect(result.POL2?.at(0)?.linkedPolicyIDs).toEqual(linkedPolicyIDs);
        expect(result.POL2?.at(0)?.id).toBe('1234_stripe');
    });
});

describe('getFeedInfo', () => {
    const cardFeedsByPolicy = getCardFeedsForDisplayPerPolicy(cardFeedsMock, translateLocal);

    it('returns undefined when feedId is empty', () => {
        expect(getFeedInfo('', cardFeedsByPolicy)).toBeUndefined();
    });

    it('returns undefined when cardFeedsByPolicy is undefined', () => {
        expect(getFeedInfo('1234_vcf', undefined)).toBeUndefined();
    });

    it('returns undefined when cardFeedsByPolicy is empty', () => {
        expect(getFeedInfo('1234_vcf', {})).toBeUndefined();
    });

    it('returns undefined when feedId does not match any feed', () => {
        expect(getFeedInfo('9999_nonexistent', cardFeedsByPolicy)).toBeUndefined();
    });

    it('returns the feed when found in first policy', () => {
        const result = getFeedInfo('1234_oauth.americanexpressfdx.com 1001', cardFeedsByPolicy);
        expect(result).toEqual({
            id: '1234_oauth.americanexpressfdx.com 1001',
            fundID: '1234',
            feed: 'oauth.americanexpressfdx.com 1001',
            name: 'American Express',
            linkedPolicyIDs: undefined,
            country: '',
        });
    });

    it('returns the feed when found in another policy', () => {
        const result = getFeedInfo('1234_vcf', cardFeedsByPolicy);
        expect(result).toEqual({
            id: '1234_vcf',
            fundID: '1234',
            feed: 'vcf',
            name: 'Custom feed name',
            linkedPolicyIDs: undefined,
            country: '',
        });
    });

    it('returns the feed when id matches in policy with multiple feeds', () => {
        const result = getFeedInfo('1234_stripe', cardFeedsByPolicy);
        expect(result).toEqual({
            id: '1234_stripe',
            fundID: '1234',
            feed: 'stripe',
            name: 'Stripe',
            linkedPolicyIDs: undefined,
            country: '',
        });
    });
});

describe('getExpensifyCardFeedsForDisplay', () => {
    it('returns empty object when allCards is undefined', () => {
        expect(getExpensifyCardFeedsForDisplay(undefined)).toEqual({});
    });

    it('returns empty object when allCards is empty', () => {
        expect(getExpensifyCardFeedsForDisplay({})).toEqual({});
    });

    it('returns empty object when no cards have Expensify Card bank', () => {
        const allCards = {
            '1': {bank: 'vcf', fundID: '5555'},
            '2': {bank: 'stripe', fundID: '6666'},
        } as unknown as CardList;

        expect(getExpensifyCardFeedsForDisplay(allCards)).toEqual({});
    });

    it('returns empty object when Expensify Cards have no fundID', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: undefined},
            '2': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: ''},
        } as unknown as CardList;

        expect(getExpensifyCardFeedsForDisplay(allCards)).toEqual({});
    });

    it('returns a single feed entry for one Expensify Card with fundID', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
        } as unknown as CardList;

        expect(getExpensifyCardFeedsForDisplay(allCards)).toEqual({
            '5555_Expensify Card': {id: '5555_Expensify Card', fundID: '5555', feed: CONST.EXPENSIFY_CARD.BANK, name: CONST.EXPENSIFY_CARD.BANK},
        });
    });

    it('deduplicates cards with the same fundID', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
            '2': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
            '3': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['5555_Expensify Card']).toEqual({id: '5555_Expensify Card', fundID: '5555', feed: CONST.EXPENSIFY_CARD.BANK, name: CONST.EXPENSIFY_CARD.BANK});
    });

    it('returns separate entries for different fundIDs', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
            '2': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '6666'},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result)).toHaveLength(2);
        expect(result['5555_Expensify Card']).toEqual({id: '5555_Expensify Card', fundID: '5555', feed: CONST.EXPENSIFY_CARD.BANK, name: CONST.EXPENSIFY_CARD.BANK});
        expect(result['6666_Expensify Card']).toEqual({id: '6666_Expensify Card', fundID: '6666', feed: CONST.EXPENSIFY_CARD.BANK, name: CONST.EXPENSIFY_CARD.BANK});
    });

    it('filters out non-Expensify cards from mixed card list', () => {
        const allCards = {
            '1': {bank: 'vcf', fundID: '5555'},
            '2': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '6666'},
            '3': {bank: 'stripe', fundID: '7777'},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['6666_Expensify Card']).toBeDefined();
    });

    it('skips Expensify Cards without fundID while keeping those with fundID', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: undefined},
            '2': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: ''},
            '3': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '8888'},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['8888_Expensify Card']).toBeDefined();
    });

    it('produces the same Expensify Card entries as getCardFeedsForDisplay', () => {
        const result = getExpensifyCardFeedsForDisplay(cardListMock);
        const fullResult = getCardFeedsForDisplay({}, cardListMock, translateLocal);

        expect(result).toEqual(fullResult);
    });

    it('appends country segment to the token for US-program Expensify Cards', () => {
        const allCards = {
            '1': {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.COUNTRY.US}},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(result).toEqual({
            '5555_Expensify Card_US': {id: '5555_Expensify Card_US', fundID: '5555', feed: CONST.EXPENSIFY_CARD.BANK, name: CONST.EXPENSIFY_CARD.BANK, country: CONST.COUNTRY.US},
        });
    });

    it('collapses CURRENT feedCountry to the US wire value so pre-2024 and 2025 programs share one picker entry', () => {
        const allCards = {
            current: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.EXPENSIFY_CARD.CARD_PROGRAM.CURRENT}},
            us2025: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.COUNTRY.US}},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result)).toEqual(['5555_Expensify Card_US']);
    });

    it('emits separate picker entries for different countries on the same fundID', () => {
        const allCards = {
            us: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.COUNTRY.US}},
            gb: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.COUNTRY.GB}},
            travel: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555', nameValuePairs: {feedCountry: CONST.TRAVEL.PROGRAM_TRAVEL_US}},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result).sort()).toEqual(['5555_Expensify Card_GB', '5555_Expensify Card_TRAVEL_US', '5555_Expensify Card_US'].sort());
        expect(result['5555_Expensify Card_GB'].country).toBe(CONST.COUNTRY.GB);
        expect(result['5555_Expensify Card_TRAVEL_US'].country).toBe(CONST.TRAVEL.PROGRAM_TRAVEL_US);
    });

    it('falls back to the legacy 2-segment token when feedCountry is missing or unknown', () => {
        const allCards = {
            noCountry: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '5555'},
            unknown: {bank: CONST.EXPENSIFY_CARD.BANK, fundID: '6666', nameValuePairs: {feedCountry: 'MARS'}},
        } as unknown as CardList;

        const result = getExpensifyCardFeedsForDisplay(allCards);
        expect(Object.keys(result).sort()).toEqual(['5555_Expensify Card', '6666_Expensify Card']);
        expect(result['5555_Expensify Card'].country).toBeUndefined();
    });
});

describe('country-aware domain feed picker', () => {
    beforeAll(() => {
        IntlStore.load(CONST.LOCALES.EN);
        return waitForBatchedUpdates();
    });

    const expensifyCardBase = (cardID: number, fundID: string, country?: string) => ({
        accountID: cardID,
        lastUpdated: '2024-11-29',
        bank: CONST.EXPENSIFY_CARD.BANK,
        cardID,
        cardName: `${cardID}XXXXXX`,
        domainName: 'user.com',
        fraud: 'none',
        fundID,
        lastFourPAN: '1234',
        lastScrape: '',
        lastScrapeResult: 200,
        scrapeMinDate: '',
        state: 3,
        ...(country ? {nameValuePairs: {feedCountry: country}} : {}),
    });

    it('splits Expensify Card rows by country in getCardFeedNamesWithType', () => {
        const workspaceCardFeeds = {
            'cards_5555_Expensify Card': {
                '1': expensifyCardBase(1, '5555', CONST.COUNTRY.US),
                '2': expensifyCardBase(2, '5555', CONST.COUNTRY.GB),
                '3': expensifyCardBase(3, '5555', CONST.TRAVEL.PROGRAM_TRAVEL_US),
            },
        } as unknown as Record<string, WorkspaceCardsList>;

        const names = getCardFeedNamesWithType({workspaceCardFeeds, policies: undefined, translate: translateLocal});
        expect(Object.keys(names).sort()).toEqual(['cards_5555_Expensify Card_GB', 'cards_5555_Expensify Card_TRAVEL_US', 'cards_5555_Expensify Card_US']);
        // `isBankRepeating` is true here because one workspace key + three domain-feed entries share the Expensify Card
        // bank, so the template appends the domain as a disambiguating label.
        expect(names['cards_5555_Expensify Card_US'].name).toBe('All Expensify (US) - user.com');
        expect(names['cards_5555_Expensify Card_GB'].name).toBe('All Expensify (GB) - user.com');
        expect(names['cards_5555_Expensify Card_TRAVEL_US'].name).toBe('All Expensify (TRAVEL_US) - user.com');
    });

    it('collapses CURRENT and US into one row under the US suffix', () => {
        const workspaceCardFeeds = {
            'cards_5555_Expensify Card': {
                '1': expensifyCardBase(1, '5555', CONST.EXPENSIFY_CARD.CARD_PROGRAM.CURRENT),
                '2': expensifyCardBase(2, '5555', CONST.COUNTRY.US),
            },
        } as unknown as Record<string, WorkspaceCardsList>;

        const names = getCardFeedNamesWithType({workspaceCardFeeds, policies: undefined, translate: translateLocal});
        expect(Object.keys(names)).toEqual(['cards_5555_Expensify Card_US']);
        expect(names['cards_5555_Expensify Card_US'].name).toBe('All Expensify (US) - user.com');
    });

    it('keeps the legacy 2-segment row when feedCountry is missing or unknown', () => {
        const workspaceCardFeeds = {
            'cards_5555_Expensify Card': {
                '1': expensifyCardBase(1, '5555'),
                '2': expensifyCardBase(2, '5555', 'MARS'),
            },
        } as unknown as Record<string, WorkspaceCardsList>;

        const names = getCardFeedNamesWithType({workspaceCardFeeds, policies: undefined, translate: translateLocal});
        expect(Object.keys(names)).toEqual(['cards_5555_Expensify Card']);
        expect(names['cards_5555_Expensify Card'].name).toBe('All Expensify - user.com');
    });

    it("resolves a 3-segment selection to only that country's cards", () => {
        const cardList = {
            '1': expensifyCardBase(1, '5555', CONST.COUNTRY.US),
            '2': expensifyCardBase(2, '5555', CONST.COUNTRY.GB),
            '3': expensifyCardBase(3, '5555', CONST.COUNTRY.US),
        } as unknown as CardList;

        const selected = getSelectedCardsFromFeeds(cardList, {}, ['5555_Expensify Card_US']);
        expect(selected.sort()).toEqual(['1', '3']);
    });

    it('resolves a legacy 2-segment selection to every country bucket for the fundID', () => {
        const cardList = {
            '1': expensifyCardBase(1, '5555', CONST.COUNTRY.US),
            '2': expensifyCardBase(2, '5555', CONST.COUNTRY.GB),
            '3': expensifyCardBase(3, '5555', CONST.TRAVEL.PROGRAM_TRAVEL_US),
        } as unknown as CardList;

        const selected = getSelectedCardsFromFeeds(cardList, {}, ['5555_Expensify Card']);
        expect(selected.sort()).toEqual(['1', '2', '3']);
    });

    it('still resolves a 2-segment selection when cards carry no feedCountry', () => {
        const cardList = {
            '1': expensifyCardBase(1, '5555'),
            '2': expensifyCardBase(2, '5555'),
        } as unknown as CardList;

        const selected = getSelectedCardsFromFeeds(cardList, {}, ['5555_Expensify Card']);
        expect(selected.sort()).toEqual(['1', '2']);
    });
});
