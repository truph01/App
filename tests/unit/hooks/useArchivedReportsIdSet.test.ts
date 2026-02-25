import {renderHook, waitFor} from '@testing-library/react-native';
import Onyx from 'react-native-onyx';
import useArchivedReportsIdSet from '@hooks/useArchivedReportsIdSet';
import ONYXKEYS from '@src/ONYXKEYS';

describe('useArchivedReportsIdSet', () => {
    beforeAll(() => {
        Onyx.init({keys: ONYXKEYS});
    });

    beforeEach(async () => {
        await Onyx.clear();
    });

    it('should return an empty Set when no report name value pairs exist', async () => {
        const {result} = renderHook(() => useArchivedReportsIdSet());

        await waitFor(() => {
            expect(result.current).toBeInstanceOf(Set);
            expect(result.current.size).toBe(0);
        });
    });

    it('should return a Set containing only archived report IDs', async () => {
        const archivedKey = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}123`;
        const activeKey = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}456`;

        await Onyx.merge(archivedKey, {private_isArchived: 'archived'});
        await Onyx.merge(activeKey, {private_isArchived: ''});

        const {result} = renderHook(() => useArchivedReportsIdSet());

        await waitFor(() => {
            expect(result.current.size).toBe(1);
            expect(result.current.has(archivedKey)).toBe(true);
            expect(result.current.has(activeKey)).toBe(false);
        });
    });

    it('should return multiple archived report IDs', async () => {
        const key1 = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}100`;
        const key2 = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}200`;
        const key3 = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}300`;

        await Onyx.merge(key1, {private_isArchived: 'archived'});
        await Onyx.merge(key2, {private_isArchived: 'archived'});
        await Onyx.merge(key3, {private_isArchived: ''});

        const {result} = renderHook(() => useArchivedReportsIdSet());

        await waitFor(() => {
            expect(result.current.size).toBe(2);
            expect(result.current.has(key1)).toBe(true);
            expect(result.current.has(key2)).toBe(true);
            expect(result.current.has(key3)).toBe(false);
        });
    });

    it('should update when a report becomes archived', async () => {
        const key = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}123`;

        await Onyx.merge(key, {private_isArchived: ''});

        const {result} = renderHook(() => useArchivedReportsIdSet());

        await waitFor(() => {
            expect(result.current.has(key)).toBe(false);
        });

        await Onyx.merge(key, {private_isArchived: 'archived'});

        await waitFor(() => {
            expect(result.current.has(key)).toBe(true);
        });
    });

    it('should handle undefined values in the collection', async () => {
        const archivedKey = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}123`;
        const undefinedKey = `${ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS}456`;

        await Onyx.merge(archivedKey, {private_isArchived: 'archived'});
        await Onyx.merge(undefinedKey, null);

        const {result} = renderHook(() => useArchivedReportsIdSet());

        await waitFor(() => {
            expect(result.current.size).toBe(1);
            expect(result.current.has(archivedKey)).toBe(true);
        });
    });
});
