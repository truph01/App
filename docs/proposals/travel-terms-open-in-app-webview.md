# Proposal: Open travel.expensify.com in in-app webview after accepting terms (Native)

## Problem

When a user completes the Travel onboarding flow on **native** (iOS/Android):

1. User goes to Travel > Let's Go, enters company address, saves, checks the terms box, and taps Continue.
2. **Expected:** User is taken to `https://staging.travel.expensify.com/` (or production) **inside the app’s webview**.
3. **Actual:** travel.expensify.com opens in an **external browser** (Safari/Chrome). The user has to return to the app and tap "Manage travel" to open it in the in-app webview.

So the first time the user reaches Travel after accepting terms, they are sent out of the app instead of staying in the app’s webview.

## Root cause

On the Travel Terms screen (`TravelTerms.tsx`), the success path after `acceptSpotnanaTerms()` always used `asyncOpenURL()`:

- `asyncOpenURL()` was called with a promise that resolved to the travel URL.
- On **web**, `asyncOpenURL` opens the URL in the same tab (or new tab), which is correct.
- On **native**, `asyncOpenURL` uses `Linking.openURL()`, which opens the URL in the **device’s default browser**, not in the in-app webview.

The app already had a native-specific way to open Travel inside the app: `openTravelDotLink()` in `@libs/openTravelDotLink/index.native.ts` uses `getTravelDotLink(activePolicyID)` to fetch a Spotnana token, then navigates to `ROUTES.TRAVEL_DOT_LINK_WEB_VIEW` (the in-app webview). The Terms flow did not use this; it built the URL and passed it to `asyncOpenURL`, so native always went to the external browser.

## Solution

Use the existing `openTravelDotLink()` abstraction for the post-terms success path so that:

- On **native**, we open Travel in the in-app webview (same as "Manage travel").
- On **web**, we still open the travel URL in the browser (same behavior as before).

To do that without duplicating the token API call, we extended `openTravelDotLink()` to accept an **optional pre-obtained token**:

1. **Refactor `openTravelDotLink()` (both implementations)**  
   Add optional parameters: `spotnanaToken?: string`, `isTestAccount?: boolean`.

   - **When `spotnanaToken` is provided:**  
     - **Native:** Navigate directly to `ROUTES.TRAVEL_DOT_LINK_WEB_VIEW.getRoute(spotnanaToken, isTestAccount, postLoginPath)` (no API call).  
     - **Web:** Build the URL with `buildTravelDotURL(spotnanaToken, isTestAccount ?? false, postLoginPath)` and open it via `asyncOpenURL` (same-tab behavior preserved).

   - **When `spotnanaToken` is not provided:**  
     Keep current behavior: native calls `getTravelDotLink(activePolicyID)` then navigates to the webview; web calls `openTravelDotLinkWeb` (API + open URL).

2. **Change `TravelTerms.tsx`**  
   After a successful `acceptSpotnanaTerms(domain, policyID)` response that contains `spotnanaToken`:

   - Stop calling `asyncOpenURL(..., (travelDotURL) => travelDotURL ?? '')`.
   - Call `openTravelDotLink(policyID, undefined, response.spotnanaToken, response.isTestAccount ?? false)` so that:
     - On native, the token is used to navigate to the Travel webview screen (in-app).
     - On web, the token is used to build and open the URL (unchanged behavior).

All existing call sites that only pass `(activePolicyID)` or `(activePolicyID, postLoginPath)` remain valid; the new parameters are optional.

## Files changed

| File | Change |
|------|--------|
| `src/libs/openTravelDotLink/index.native.ts` | Add `spotnanaToken?`, `isTestAccount?`; when token is present, navigate to `TRAVEL_DOT_LINK_WEB_VIEW` immediately without calling `getTravelDotLink`. |
| `src/libs/openTravelDotLink/index.ts` | Add `spotnanaToken?`, `isTestAccount?`; when token is present, build URL with `buildTravelDotURL` and open via `asyncOpenURL`. |
| `src/pages/Travel/TravelTerms.tsx` | Remove `asyncOpenURL` and `buildTravelDotURL` from success path; on success call `openTravelDotLink(policyID, undefined, response.spotnanaToken, response.isTestAccount ?? false)`. |

## Alternative considered

- **Platform check in `TravelTerms` only:** Call `Navigation.navigate(ROUTES.TRAVEL_DOT_LINK_WEB_VIEW.getRoute(...))` on native and `asyncOpenURL` on web from the Terms screen. This would duplicate the “how to open Travel” logic and the route/token handling that already lives in `openTravelDotLink`. Extending `openTravelDotLink` to accept an optional token keeps one place responsible for “open Travel” and reuses it for both “Manage travel” and “just accepted terms.”

## Testing

- **Native:** Complete Travel onboarding (company address, accept terms, Continue). Confirm travel.expensify.com opens in the in-app webview, not in the external browser.
- **Native:** Tap “Manage travel” from the Travel section. Confirm it still opens in the in-app webview.
- **Web:** Complete the same flow; confirm the travel URL still opens in the same tab as before.
- **Web:** Use “Manage travel” / other entry points that call `openTravelDotLink(activePolicyID)` without a token; confirm behavior unchanged.
