import React from 'react';
import {View} from 'react-native';
import DecisionModal from '@components/DecisionModal';
import HoldOrRejectEducationalModal from '@components/HoldOrRejectEducationalModal';
import HoldSubmitterEducationalModal from '@components/HoldSubmitterEducationalModal';
import {useSearchContext} from '@components/Search/SearchContext';
import type {SearchQueryJSON} from '@components/Search/types';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useSearchBulkActions from '@hooks/useSearchBulkActions';
import useThemeStyles from '@hooks/useThemeStyles';
import type {SearchResults} from '@src/types/onyx';
import SearchPageFooter from './SearchPageFooter';
import SearchFiltersBar from './SearchPageHeader/SearchFiltersBar';
import SearchPageHeader from './SearchPageHeader/SearchPageHeader';

type SearchBulkActionsButtonProps = {
    queryJSON: SearchQueryJSON;
    searchResults: SearchResults | undefined;
    isMobileSelectionModeEnabled: boolean;
};

function SearchBulkActionsButton({queryJSON, searchResults, isMobileSelectionModeEnabled}: SearchBulkActionsButtonProps) {
    // We need to use isSmallScreenWidth instead of shouldUseNarrowLayout for the decision modal type
    // eslint-disable-next-line rulesdir/prefer-shouldUseNarrowLayout-instead-of-isSmallScreenWidth
    const {isSmallScreenWidth, shouldUseNarrowLayout} = useResponsiveLayout();
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const {
        headerButtonsOptions,
        selectedPolicyIDs,
        selectedTransactionReportIDs,
        selectedReportIDs,
        latestBankItems,
        stableOnBulkPaySelected,
        isOfflineModalVisible,
        setIsOfflineModalVisible,
        isDownloadErrorModalVisible,
        setIsDownloadErrorModalVisible,
        emptyReportsCount,
        isHoldEducationalModalVisible,
        rejectModalAction,
        dismissModalAndUpdateUseHold,
        dismissRejectModalBasedOnAction,
    } = useSearchBulkActions({queryJSON, searchResults});

    return (
        <>
            {shouldUseNarrowLayout && isMobileSelectionModeEnabled && (
                <SearchPageHeader
                    queryJSON={queryJSON}
                    headerButtonsOptions={headerButtonsOptions}
                    handleSearch={() => {}}
                    isMobileSelectionModeEnabled={isMobileSelectionModeEnabled}
                    currentSelectedPolicyID={selectedPolicyIDs?.at(0)}
                    currentSelectedReportID={selectedTransactionReportIDs?.at(0) ?? selectedReportIDs?.at(0)}
                    confirmPayment={stableOnBulkPaySelected}
                    latestBankItems={latestBankItems}
                />
            )}
            {!shouldUseNarrowLayout && (
                <SearchFiltersBar
                    queryJSON={queryJSON}
                    headerButtonsOptions={headerButtonsOptions}
                    isMobileSelectionModeEnabled={isMobileSelectionModeEnabled}
                    currentSelectedPolicyID={selectedPolicyIDs?.at(0)}
                    currentSelectedReportID={selectedTransactionReportIDs?.at(0) ?? selectedReportIDs?.at(0)}
                    confirmPayment={stableOnBulkPaySelected}
                    latestBankItems={latestBankItems}
                />
            )}
            {(!shouldUseNarrowLayout || isMobileSelectionModeEnabled) && (
                <View>
                    <DecisionModal
                        title={translate('common.youAppearToBeOffline')}
                        prompt={translate('common.offlinePrompt')}
                        isSmallScreenWidth={isSmallScreenWidth}
                        onSecondOptionSubmit={() => setIsOfflineModalVisible(false)}
                        secondOptionText={translate('common.buttonConfirm')}
                        isVisible={isOfflineModalVisible}
                        onClose={() => setIsOfflineModalVisible(false)}
                    />
                    {!!rejectModalAction && (
                        <HoldOrRejectEducationalModal
                            onClose={dismissRejectModalBasedOnAction}
                            onConfirm={dismissRejectModalBasedOnAction}
                        />
                    )}
                    {!!isHoldEducationalModalVisible && (
                        <HoldSubmitterEducationalModal
                            onClose={dismissModalAndUpdateUseHold}
                            onConfirm={dismissModalAndUpdateUseHold}
                        />
                    )}
                </View>
            )}
            <DecisionModal
                title={translate('common.downloadFailedTitle')}
                prompt={emptyReportsCount ? translate('common.downloadFailedEmptyReportDescription', {count: emptyReportsCount}) : translate('common.downloadFailedDescription')}
                isSmallScreenWidth={isSmallScreenWidth}
                onSecondOptionSubmit={() => setIsDownloadErrorModalVisible(false)}
                secondOptionText={translate('common.buttonConfirm')}
                isVisible={isDownloadErrorModalVisible}
                onClose={() => setIsDownloadErrorModalVisible(false)}
            />
        </>
    );
}

SearchBulkActionsButton.displayName = 'SearchBulkActionsButton';

export default SearchBulkActionsButton;
