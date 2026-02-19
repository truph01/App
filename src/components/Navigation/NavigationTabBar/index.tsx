import {findFocusedRoute, StackActions, useNavigationState} from '@react-navigation/native';
import type {NavigationState} from '@react-navigation/native';
import React from 'react';
import {View} from 'react-native';
import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import FloatingCameraButton from '@components/FloatingCameraButton';
import FloatingGPSButton from '@components/FloatingGPSButton';
import ImageSVG from '@components/ImageSVG';
import DebugTabView from '@components/Navigation/DebugTabView';
import {PressableWithFeedback} from '@components/Pressable';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useReportAttributes from '@hooks/useReportAttributes';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useRootNavigationState from '@hooks/useRootNavigationState';
import useSearchTypeMenuSections from '@hooks/useSearchTypeMenuSections';
import {useSidebarOrderedReports} from '@hooks/useSidebarOrderedReports';
import useStyleUtils from '@hooks/useStyleUtils';
import useSubscriptionPlan from '@hooks/useSubscriptionPlan';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import useWorkspacesTabIndicatorStatus from '@hooks/useWorkspacesTabIndicatorStatus';
import clearSelectedText from '@libs/clearSelectedText/clearSelectedText';
import interceptAnonymousUser from '@libs/interceptAnonymousUser';
import {getPreservedNavigatorState} from '@libs/Navigation/AppNavigator/createSplitNavigator/usePreserveNavigatorState';
import getAccountTabScreenToOpen from '@libs/Navigation/helpers/getAccountTabScreenToOpen';
import isRoutePreloaded from '@libs/Navigation/helpers/isRoutePreloaded';
import navigateToWorkspacesPage, {getWorkspaceNavigationRouteState} from '@libs/Navigation/helpers/navigateToWorkspacesPage';
import Navigation from '@libs/Navigation/Navigation';
import {buildCannedSearchQuery, buildSearchQueryJSON, buildSearchQueryString} from '@libs/SearchQueryUtils';
import {getDefaultActionableSearchMenuItem} from '@libs/SearchUIUtils';
import {startSpan} from '@libs/telemetry/activeSpans';
import type {BrickRoad} from '@libs/WorkspacesSettingsUtils';
import {getChatTabBrickRoad} from '@libs/WorkspacesSettingsUtils';
import navigationRef from '@navigation/navigationRef';
import type {DomainSplitNavigatorParamList, ReportsSplitNavigatorParamList, SearchFullscreenNavigatorParamList, WorkspaceSplitNavigatorParamList} from '@navigation/types';
import NavigationTabBarAvatar from '@pages/inbox/sidebar/NavigationTabBarAvatar';
import NavigationTabBarFloatingActionButton from '@pages/inbox/sidebar/NavigationTabBarFloatingActionButton';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import type {Screen} from '@src/SCREENS';
import type {Domain, Policy, Report} from '@src/types/onyx';
import NAVIGATION_TABS from './NAVIGATION_TABS';
import TabBarItem from './TabBarItem';

type NavigationTabBarProps = {
    selectedTab: ValueOf<typeof NAVIGATION_TABS>;
    isTopLevelBar?: boolean;
    shouldShowFloatingButtons?: boolean;
};

function doesLastReportExistSelector(report: OnyxEntry<Report>) {
    return !!report?.reportID;
}

function getLastRoute(rootState: NavigationState, navigator: ValueOf<typeof NAVIGATORS>, screen: Screen) {
    const lastNavigator = rootState.routes.findLast((route) => route.name === navigator);
    const lastNavigatorState = lastNavigator && lastNavigator.key ? getPreservedNavigatorState(lastNavigator?.key) : undefined;
    const lastRoute = lastNavigatorState?.routes.findLast((route) => route.name === screen);
    return lastRoute;
}

function getInboxBrickRoadColor(brickRoad: BrickRoad, theme: ReturnType<typeof useTheme>) {
    return brickRoad === CONST.BRICK_ROAD_INDICATOR_STATUS.INFO ? theme.iconSuccessFill : theme.danger;
}

function NavigationTabBar({selectedTab, isTopLevelBar = false, shouldShowFloatingButtons = true}: NavigationTabBarProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {translate, preferredLocale} = useLocalize();
    const expensifyIcons = useMemoizedLazyExpensifyIcons(['ExpensifyAppIcon', 'Home', 'Inbox', 'MoneySearch', 'Buildings']);

    const [isDebugModeEnabled] = useOnyx(ONYXKEYS.IS_DEBUG_MODE_ENABLED, {canBeMissing: true});
    const [savedSearches] = useOnyx(ONYXKEYS.SAVED_SEARCHES, {canBeMissing: true});
    const [lastSearchParams] = useOnyx(ONYXKEYS.REPORT_NAVIGATION_LAST_SEARCH_QUERY, {canBeMissing: true});
    const {login: currentUserLogin} = useCurrentUserPersonalDetails();
    const subscriptionPlan = useSubscriptionPlan();
    const {typeMenuSections} = useSearchTypeMenuSections();

    // Workspace tab: track last-viewed workspace/domain across navigations
    const navigationState = useNavigationState(findFocusedRoute);
    const {lastWorkspacesTabNavigatorRoute, workspacesTabState} = getWorkspaceNavigationRouteState();
    const params = workspacesTabState?.routes?.at(0)?.params as
        | WorkspaceSplitNavigatorParamList[typeof SCREENS.WORKSPACE.INITIAL]
        | DomainSplitNavigatorParamList[typeof SCREENS.DOMAIN.INITIAL];
    const paramsPolicyID = params && 'policyID' in params ? params.policyID : undefined;
    const paramsDomainAccountID = params && 'domainAccountID' in params ? params.domainAccountID : undefined;

    const lastViewedPolicySelector = (policies: OnyxCollection<Policy>) => {
        if (!lastWorkspacesTabNavigatorRoute || lastWorkspacesTabNavigatorRoute.name !== NAVIGATORS.WORKSPACE_SPLIT_NAVIGATOR || !paramsPolicyID) {
            return undefined;
        }
        return policies?.[`${ONYXKEYS.COLLECTION.POLICY}${paramsPolicyID}`];
    };
    const [lastViewedPolicy] = useOnyx(ONYXKEYS.COLLECTION.POLICY, {canBeMissing: true, selector: lastViewedPolicySelector}, [navigationState]);

    const lastViewedDomainSelector = (domains: OnyxCollection<Domain>) => {
        if (!lastWorkspacesTabNavigatorRoute || lastWorkspacesTabNavigatorRoute.name !== NAVIGATORS.DOMAIN_SPLIT_NAVIGATOR || !paramsDomainAccountID) {
            return undefined;
        }
        return domains?.[`${ONYXKEYS.COLLECTION.DOMAIN}${paramsDomainAccountID}`];
    };
    const [lastViewedDomain] = useOnyx(ONYXKEYS.COLLECTION.DOMAIN, {canBeMissing: true, selector: lastViewedDomainSelector}, [navigationState]);

    // Inbox tab: restore last-viewed report on wide layout
    const lastReportRoute = useRootNavigationState((rootState) => {
        if (!rootState) {
            return undefined;
        }
        return getLastRoute(rootState, NAVIGATORS.REPORTS_SPLIT_NAVIGATOR, SCREENS.REPORT);
    });
    const lastReportRouteReportID = (lastReportRoute?.params as ReportsSplitNavigatorParamList[typeof SCREENS.REPORT])?.reportID;
    const [doesLastReportExist] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${lastReportRouteReportID}`, {canBeMissing: true, selector: doesLastReportExistSelector}, [lastReportRouteReportID]);

    const {indicatorColor: workspacesTabIndicatorColor, status: workspacesTabIndicatorStatus} = useWorkspacesTabIndicatorStatus();
    const {orderedReportIDs} = useSidebarOrderedReports();
    const reportAttributes = useReportAttributes();
    const chatTabBrickRoad = getChatTabBrickRoad(orderedReportIDs, reportAttributes);

    const shouldRenderDebugTabViewOnWideLayout = !!isDebugModeEnabled && !isTopLevelBar;
    const inboxStatusIndicatorColor = chatTabBrickRoad ? getInboxBrickRoadColor(chatTabBrickRoad, theme) : undefined;
    const workspacesStatusIndicatorColor = workspacesTabIndicatorStatus ? workspacesTabIndicatorColor : undefined;
    const inboxAccessibilityState = {selected: selectedTab === NAVIGATION_TABS.INBOX};
    const searchAccessibilityState = {selected: selectedTab === NAVIGATION_TABS.SEARCH};
    const workspacesAccessibilityState = {selected: selectedTab === NAVIGATION_TABS.WORKSPACES};

    // Navigation handlers
    const navigateToNewDotHome = () => {
        if (selectedTab === NAVIGATION_TABS.HOME) {
            return;
        }
        Navigation.navigate(ROUTES.HOME);
    };

    const navigateToChats = () => {
        if (selectedTab === NAVIGATION_TABS.INBOX) {
            return;
        }

        startSpan(CONST.TELEMETRY.SPAN_NAVIGATE_TO_INBOX_TAB, {
            name: CONST.TELEMETRY.SPAN_NAVIGATE_TO_INBOX_TAB,
            op: CONST.TELEMETRY.SPAN_NAVIGATE_TO_INBOX_TAB,
        });

        if (!shouldUseNarrowLayout) {
            if (doesLastReportExist && lastReportRoute) {
                const {reportID, reportActionID, referrer, backTo} = lastReportRoute.params as ReportsSplitNavigatorParamList[typeof SCREENS.REPORT];
                Navigation.navigate(ROUTES.REPORT_WITH_ID.getRoute(reportID, reportActionID, referrer, backTo));
                return;
            }

            if (isRoutePreloaded(NAVIGATORS.REPORTS_SPLIT_NAVIGATOR)) {
                navigationRef.dispatch(StackActions.push(NAVIGATORS.REPORTS_SPLIT_NAVIGATOR));
                return;
            }
        }

        Navigation.navigate(ROUTES.INBOX);
    };

    const navigateToSearch = () => {
        if (selectedTab === NAVIGATION_TABS.SEARCH) {
            return;
        }
        clearSelectedText();
        interceptAnonymousUser(() => {
            const parentSpan = startSpan(CONST.TELEMETRY.SPAN_NAVIGATE_TO_REPORTS_TAB, {
                name: CONST.TELEMETRY.SPAN_NAVIGATE_TO_REPORTS_TAB,
                op: CONST.TELEMETRY.SPAN_NAVIGATE_TO_REPORTS_TAB,
            });
            parentSpan?.setAttribute(CONST.TELEMETRY.ATTRIBUTE_ROUTE_FROM, selectedTab ?? '');

            startSpan(CONST.TELEMETRY.SPAN_ON_LAYOUT_SKELETON_REPORTS, {
                name: CONST.TELEMETRY.SPAN_ON_LAYOUT_SKELETON_REPORTS,
                op: CONST.TELEMETRY.SPAN_ON_LAYOUT_SKELETON_REPORTS,
                parentSpan,
            });

            const lastSearchRoute = getLastRoute(navigationRef.getRootState(), NAVIGATORS.SEARCH_FULLSCREEN_NAVIGATOR, SCREENS.SEARCH.ROOT);

            if (lastSearchRoute) {
                const {q, ...rest} = lastSearchRoute.params as SearchFullscreenNavigatorParamList[typeof SCREENS.SEARCH.ROOT];
                const queryJSON = buildSearchQueryJSON(q);
                if (queryJSON) {
                    const query = buildSearchQueryString(queryJSON);
                    Navigation.navigate(
                        ROUTES.SEARCH_ROOT.getRoute({
                            query,
                            ...rest,
                        }),
                    );
                    return;
                }
            }

            const flattenedMenuItems = typeMenuSections.flatMap((section) => section.menuItems);
            const defaultActionableSearchQuery =
                getDefaultActionableSearchMenuItem(flattenedMenuItems)?.searchQuery ?? flattenedMenuItems.at(0)?.searchQuery ?? typeMenuSections.at(0)?.menuItems.at(0)?.searchQuery;

            const savedSearchQuery = Object.values(savedSearches ?? {}).at(0)?.query;
            const lastQueryFromOnyx = lastSearchParams?.queryJSON ? buildSearchQueryString(lastSearchParams.queryJSON) : undefined;
            Navigation.navigate(ROUTES.SEARCH_ROOT.getRoute({query: lastQueryFromOnyx ?? defaultActionableSearchQuery ?? savedSearchQuery ?? buildCannedSearchQuery()}));
        });
    };

    const navigateToSettings = () => {
        if (selectedTab === NAVIGATION_TABS.SETTINGS) {
            return;
        }
        interceptAnonymousUser(() => {
            const accountTabPayload = getAccountTabScreenToOpen(subscriptionPlan);

            if (isRoutePreloaded(NAVIGATORS.SETTINGS_SPLIT_NAVIGATOR)) {
                navigationRef.dispatch({type: CONST.NAVIGATION.ACTION_TYPE.PUSH, payload: {name: NAVIGATORS.SETTINGS_SPLIT_NAVIGATOR, params: accountTabPayload}});
                return;
            }
            navigationRef.dispatch(StackActions.push(NAVIGATORS.SETTINGS_SPLIT_NAVIGATOR, accountTabPayload));
        });
    };

    const navigateToWorkspaces = () => {
        navigateToWorkspacesPage({shouldUseNarrowLayout, currentUserLogin, policy: lastViewedPolicy, domain: lastViewedDomain});
    };

    if (!shouldUseNarrowLayout) {
        return (
            <>
                {shouldRenderDebugTabViewOnWideLayout && (
                    <DebugTabView
                        selectedTab={selectedTab}
                        chatTabBrickRoad={chatTabBrickRoad}
                    />
                )}
                <View
                    style={styles.leftNavigationTabBarContainer}
                    testID="NavigationTabBar"
                >
                    <View style={styles.flex1}>
                        <PressableWithFeedback
                            accessibilityRole={CONST.ROLE.BUTTON}
                            accessibilityLabel={translate('common.home')}
                            accessible
                            testID="ExpensifyLogoButton"
                            onPress={navigateToChats}
                            wrapperStyle={styles.leftNavigationTabBarItem}
                            sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.EXPENSIFY_LOGO}
                        >
                            <ImageSVG
                                style={StyleUtils.getAvatarStyle(CONST.AVATAR_SIZE.DEFAULT)}
                                src={expensifyIcons.ExpensifyAppIcon}
                            />
                        </PressableWithFeedback>
                        <PressableWithFeedback
                            onPress={navigateToNewDotHome}
                            role={CONST.ROLE.TAB}
                            accessibilityLabel={translate('common.home')}
                            style={({hovered}) => [styles.leftNavigationTabBarItem, hovered && styles.navigationTabBarItemHovered]}
                            sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.HOME}
                        >
                            {({hovered}) => (
                                <TabBarItem
                                    icon={expensifyIcons.Home}
                                    label={translate('common.home')}
                                    isSelected={selectedTab === NAVIGATION_TABS.HOME}
                                    isHovered={hovered}
                                />
                            )}
                        </PressableWithFeedback>
                        <PressableWithFeedback
                            onPress={navigateToChats}
                            role={CONST.ROLE.TAB}
                            accessibilityLabel={chatTabBrickRoad ? `${translate('common.inbox')}. ${translate('common.yourReviewIsRequired')}` : translate('common.inbox')}
                            accessibilityState={inboxAccessibilityState}
                            style={({hovered}) => [styles.leftNavigationTabBarItem, hovered && styles.navigationTabBarItemHovered]}
                            sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.INBOX}
                        >
                            {({hovered}) => (
                                <TabBarItem
                                    icon={expensifyIcons.Inbox}
                                    label={translate('common.inbox')}
                                    isSelected={selectedTab === NAVIGATION_TABS.INBOX}
                                    isHovered={hovered}
                                    statusIndicatorColor={inboxStatusIndicatorColor}
                                />
                            )}
                        </PressableWithFeedback>
                        <PressableWithFeedback
                            onPress={navigateToSearch}
                            role={CONST.ROLE.TAB}
                            accessibilityLabel={translate('common.reports')}
                            accessibilityState={searchAccessibilityState}
                            style={({hovered}) => [styles.leftNavigationTabBarItem, hovered && styles.navigationTabBarItemHovered]}
                            sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.REPORTS}
                        >
                            {({hovered}) => (
                                <TabBarItem
                                    icon={expensifyIcons.MoneySearch}
                                    label={translate('common.reports')}
                                    isSelected={selectedTab === NAVIGATION_TABS.SEARCH}
                                    isHovered={hovered}
                                />
                            )}
                        </PressableWithFeedback>
                        <PressableWithFeedback
                            onPress={navigateToWorkspaces}
                            role={CONST.ROLE.TAB}
                            accessibilityLabel={`${translate('common.workspacesTabTitle')}${workspacesTabIndicatorStatus ? `. ${translate('common.yourReviewIsRequired')}` : ''}`}
                            accessibilityState={workspacesAccessibilityState}
                            style={({hovered}) => [styles.leftNavigationTabBarItem, hovered && styles.navigationTabBarItemHovered]}
                            sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.WORKSPACES}
                        >
                            {({hovered}) => (
                                <TabBarItem
                                    icon={expensifyIcons.Buildings}
                                    label={translate('common.workspacesTabTitle')}
                                    isSelected={selectedTab === NAVIGATION_TABS.WORKSPACES}
                                    isHovered={hovered}
                                    statusIndicatorColor={workspacesStatusIndicatorColor}
                                    numberOfLines={preferredLocale === CONST.LOCALES.DE || preferredLocale === CONST.LOCALES.NL ? 1 : 2}
                                />
                            )}
                        </PressableWithFeedback>
                        <NavigationTabBarAvatar
                            style={styles.leftNavigationTabBarItem}
                            isSelected={selectedTab === NAVIGATION_TABS.SETTINGS}
                            onPress={navigateToSettings}
                        />
                    </View>
                    <View style={styles.leftNavigationTabBarFAB}>
                        <NavigationTabBarFloatingActionButton />
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            {!!isDebugModeEnabled && (
                <DebugTabView
                    selectedTab={selectedTab}
                    chatTabBrickRoad={chatTabBrickRoad}
                />
            )}
            <View
                style={styles.navigationTabBarContainer}
                testID="NavigationTabBar"
            >
                <PressableWithFeedback
                    onPress={navigateToNewDotHome}
                    role={CONST.ROLE.TAB}
                    accessibilityLabel={translate('common.home')}
                    wrapperStyle={styles.flex1}
                    style={styles.navigationTabBarItem}
                    sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.HOME}
                >
                    <TabBarItem
                        icon={expensifyIcons.Home}
                        label={translate('common.home')}
                        isSelected={selectedTab === NAVIGATION_TABS.HOME}
                    />
                </PressableWithFeedback>
                <PressableWithFeedback
                    onPress={navigateToChats}
                    role={CONST.ROLE.TAB}
                    accessibilityLabel={chatTabBrickRoad ? `${translate('common.inbox')}. ${translate('common.yourReviewIsRequired')}` : translate('common.inbox')}
                    accessibilityState={inboxAccessibilityState}
                    wrapperStyle={styles.flex1}
                    style={styles.navigationTabBarItem}
                    sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.INBOX}
                >
                    <TabBarItem
                        icon={expensifyIcons.Inbox}
                        label={translate('common.inbox')}
                        isSelected={selectedTab === NAVIGATION_TABS.INBOX}
                        statusIndicatorColor={inboxStatusIndicatorColor}
                        numberOfLines={1}
                    />
                </PressableWithFeedback>
                <PressableWithFeedback
                    onPress={navigateToSearch}
                    role={CONST.ROLE.TAB}
                    accessibilityLabel={translate('common.reports')}
                    accessibilityState={searchAccessibilityState}
                    wrapperStyle={styles.flex1}
                    style={styles.navigationTabBarItem}
                    sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.REPORTS}
                >
                    <TabBarItem
                        icon={expensifyIcons.MoneySearch}
                        label={translate('common.reports')}
                        isSelected={selectedTab === NAVIGATION_TABS.SEARCH}
                        numberOfLines={1}
                    />
                </PressableWithFeedback>
                <PressableWithFeedback
                    onPress={navigateToWorkspaces}
                    role={CONST.ROLE.TAB}
                    accessibilityLabel={`${translate('common.workspacesTabTitle')}${workspacesTabIndicatorStatus ? `. ${translate('common.yourReviewIsRequired')}` : ''}`}
                    accessibilityState={workspacesAccessibilityState}
                    wrapperStyle={styles.flex1}
                    style={styles.navigationTabBarItem}
                    sentryLabel={CONST.SENTRY_LABEL.NAVIGATION_TAB_BAR.WORKSPACES}
                >
                    <TabBarItem
                        icon={expensifyIcons.Buildings}
                        label={translate('common.workspacesTabTitle')}
                        isSelected={selectedTab === NAVIGATION_TABS.WORKSPACES}
                        statusIndicatorColor={workspacesStatusIndicatorColor}
                        numberOfLines={1}
                    />
                </PressableWithFeedback>
                <NavigationTabBarAvatar
                    style={styles.navigationTabBarItem}
                    isSelected={selectedTab === NAVIGATION_TABS.SETTINGS}
                    onPress={navigateToSettings}
                />
            </View>

            {shouldShowFloatingButtons && (
                <>
                    <View style={[styles.navigationTabBarFABItem, styles.ph0, styles.floatingActionButtonPosition]}>
                        <NavigationTabBarFloatingActionButton />
                    </View>
                    <FloatingGPSButton />
                    <FloatingCameraButton />
                </>
            )}
        </>
    );
}

export default NavigationTabBar;
