import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import {usePersonalDetails} from '@components/OnyxListItemProvider';
import {createOptionList} from '@libs/PersonalDetailOptionsListUtils';
import type {OptionData} from '@libs/PersonalDetailOptionsListUtils/types';
import {isOneOnOneChat, isSelfDM} from '@libs/ReportUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Report, ReportAttributesDerivedValue, ReportNameValuePairs} from '@src/types/onyx';
import type {ReportAttributes} from '@src/types/onyx/DerivedValues';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import mapOnyxCollectionItems from '@src/utils/mapOnyxCollectionItems';
import useCurrentUserPersonalDetails from './useCurrentUserPersonalDetails';
import useLocalize from './useLocalize';
import useOnyx from './useOnyx';

type UseFilteredOptionsConfig = {
    /** Whether the hook should be enabled (default: true) */
    enabled?: boolean;
};

type UseFilteredOptionsResult = {
    /** The computed options list (personal details) */
    options: OptionData[] | undefined;
    /** The current user option (personal detail) */
    currentOption: OptionData | undefined;
    /** Whether the options are currently being loaded (initial load) */
    isLoading: boolean;
};

const generateAccountIDToReportIDMap = (reports: OnyxCollection<Report>, currentUserAccountID: number) => {
    if (!reports) {
        return {};
    }

    const accountIDToReportIDMap: Record<number, string> = {};
    for (const report of Object.values(reports)) {
        if (!report || !report.participants) {
            continue;
        }
        // This means it's a self-DM
        if (Object.keys(report.participants).length === 1) {
            accountIDToReportIDMap[currentUserAccountID] = report.reportID;
            continue;
        }
        for (const accountID of Object.keys(report.participants)) {
            if (Number(accountID) === currentUserAccountID) {
                continue;
            }
            accountIDToReportIDMap[Number(accountID)] = report.reportID;
        }
    }
    return accountIDToReportIDMap;
};

const reportsSelector = (reports: OnyxCollection<Report>) => {
    return mapOnyxCollectionItems(reports, (report) => {
        if (!report) {
            return;
        }

        if (!isOneOnOneChat(report) && !isSelfDM(report)) {
            return;
        }

        return {
            reportID: report.reportID,
            participants: report.participants,
            lastVisibleActionCreated: report.lastVisibleActionCreated,
        };
    });
};

const rNVPSelector = (rNVPCollection: OnyxCollection<ReportNameValuePairs>, reportIDsSet: Set<string>): OnyxCollection<ReportNameValuePairs> => {
    return Object.entries(rNVPCollection ?? {}).reduce((acc: NonNullable<OnyxCollection<ReportNameValuePairs>>, [reportID, rNVP]) => {
        if (!rNVP) {
            return acc;
        }
        if (reportIDsSet.has(reportID)) {
            acc[reportID] = {private_isArchived: rNVP.private_isArchived};
        }
        return acc;
    }, {});
};

const reportAttributesSelector = (reportAttributes: OnyxEntry<ReportAttributesDerivedValue>, reportIDsSet: Set<string>) => {
    return Object.entries(reportAttributes?.reports ?? {}).reduce((acc: Record<string, ReportAttributes>, [key, entry]) => {
        if (reportIDsSet.has(key)) {
            acc[key] = entry;
        }

        return acc;
    }, {});
};

/**
 * Hook that provides options list for personal details.
 *
 * Benefits over OptionListContextProvider:
 * - Only computes when screen is mounted and enabled
 * - No background recalculations when screen is not visible
 * - Smart reduced data computation for performance (only necessary data for personal details)
 * - Recalculates only when dependencies change
 *
 * Usage:
 * const {options, isLoading} = usePersonalDetailOptions({
 *   enabled: didScreenTransitionEnd,
 * });
 *
 * <SelectionList
 *   sections={isLoading ? [] : sections}
 *   showLoadingPlaceholder={isLoading}
 * />
 */
function usePersonalDetailOptions(config: UseFilteredOptionsConfig = {}): UseFilteredOptionsResult {
    const {enabled = true} = config;

    const {accountID} = useCurrentUserPersonalDetails();
    const {formatPhoneNumber} = useLocalize();
    const [reports, reportsMetadata] = useOnyx(ONYXKEYS.COLLECTION.REPORT, {
        canBeMissing: true,
        selector: reportsSelector,
    });
    const reportIDsSet = new Set(Object.keys(reports ?? {}));
    const reportAttributesSelectorWithReportIDs = (reportAttributes: OnyxEntry<ReportAttributesDerivedValue>) => reportAttributesSelector(reportAttributes, reportIDsSet);
    const rNVPSelectorWithReportIDs = (rNVPCollection: OnyxCollection<ReportNameValuePairs>) => rNVPSelector(rNVPCollection, reportIDsSet);
    const [reportAttributes, reportAttributesMetadata] = useOnyx(ONYXKEYS.DERIVED.REPORT_ATTRIBUTES, {canBeMissing: true, selector: reportAttributesSelectorWithReportIDs});
    const [reportNameValuePairs, reportNameValuePairsMetadata] = useOnyx(ONYXKEYS.COLLECTION.REPORT_NAME_VALUE_PAIRS, {
        canBeMissing: true,
        selector: rNVPSelectorWithReportIDs,
    });
    const personalDetails = usePersonalDetails();

    const isLoading = !enabled || isLoadingOnyxValue(reportsMetadata, reportAttributesMetadata, reportNameValuePairsMetadata);

    const accountIDToReportIDMap = generateAccountIDToReportIDMap(reports, accountID);
    const optionsData = !isLoading ? createOptionList(accountID, personalDetails, accountIDToReportIDMap, reports, reportAttributes, reportNameValuePairs, formatPhoneNumber) : undefined;

    return {
        options: optionsData?.options,
        currentOption: optionsData?.currentUserOption,
        isLoading: !optionsData,
    };
}

export default usePersonalDetailOptions;
