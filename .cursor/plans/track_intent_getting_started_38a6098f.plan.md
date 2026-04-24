---
name: Track intent Getting Started
overview: Extend the Home "Getting started" section to support the `Track and budget my expenses` onboarding intent with three to-dos (Create workspace always-checked, Customize accounting categories, Invite your accountant) and apply the Track-only mobile ordering swap (For you 3rd, Getting started 4th).
todos:
  - id: tests-hook
    content: Add failing tests in useGettingStartedItems.test.ts for TRACK_WORKSPACE visibility, three items, category/member check logic, and routing targets; keep MANAGE_TEAM regression tests
    status: completed
  - id: tests-ordering
    content: "Add failing test(s) covering mobile ordering: TRACK_WORKSPACE renders ForYou before GettingStarted; MANAGE_TEAM keeps existing order"
    status: completed
  - id: impl-hook
    content: "Extend useGettingStartedItems.ts with a TRACK_WORKSPACE branch (3 items: createWorkspace always checked, customizeCategories using hasCustomCategories, inviteAccountant using employeeList count >= 2) reusing isWithinGettingStartedPeriod and isPolicyAdmin"
    status: completed
  - id: impl-ordering
    content: Update HomePage.tsx mobile branch to swap GettingStartedSection and ForYouSection only when introSelected.choice === TRACK_WORKSPACE
    status: completed
  - id: impl-i18n
    content: Add `inviteAccountant` key to homePage.gettingStartedSection in src/languages/en.ts and src/languages/es.ts only, and verify typecheck passes
    status: completed
  - id: polish
    content: Run prettier, eslint, typecheck-tsgo, and react-compiler-compliance-check on changed files; ensure all new tests pass and no regressions
    status: completed
isProject: false
---

## Issue Summary

- URL: [https://github.com/Expensify/App/issues/88159](https://github.com/Expensify/App/issues/88159)
- Goal: Add a Home "Getting started" onboarding slot for the `Track and budget my expenses` (backend: `TRACK_WORKSPACE`) intent, with 3 to-dos and a Track-specific mobile ordering, reusing the same section component that already supports the `Manage team` intent.
- In-scope (explicit):
  - Show the existing "Getting started" slot titled "Getting started" (already localized).
  - Desktop: right column, 2nd spot under Free Trial (already matches current layout, no change).
  - Mobile: Track intent only - put `Getting started` in position 4, `For you` in position 3.
  - Visibility: only during new sign-ups and active trials; hide after 60 days from trial start.
  - Only for the Track intent (`introSelected?.choice === TRACK_WORKSPACE`).
  - Three to-dos:
    1. `Create a workspace` - always checked (no action-state tracking).
    2. `Customize accounting categories` - navigate to `ROUTES.WORKSPACE_CATEGORIES`, auto-checked when the active workspace has >=1 non-default category.
    3. `Invite your accountant` - navigate to `ROUTES.WORKSPACE_MEMBERS`, auto-checked when the active workspace has >=2 members in `policy.employeeList`.
- Out-of-scope (explicit):
  - No persisted/saved state for checked/unchecked (purely visual).
  - No change to existing Manage team ordering or behavior.
  - No new backend/API changes; reuse existing Onyx keys and routes.

## Explicit Requirements (from issue)

1. Slot title = `Getting started` (existing translation `homePage.gettingStartedSection.title`).
2. Desktop: right column, 2nd spot (below Free Trial slot).
3. Mobile: 4th position (below `For you` in 3rd).L
4. Applies only to new sign-ups and active trials; hide after 60 days if tasks unfinished.
5. Applies only to the "track and budget my expenses" intent.
6. Clicking anywhere on a to-do row navigates to the feature route.
7. `Create a workspace` - always checked for Track intent.
8. `Customize accounting categories` - navigate to `/categories`; check when policy has >=1 non-default category.
9. `Invite your accountant` - navigate to `/members`; check when policy has >=2 members.

## Confirmed Decisions (from user)

- Mobile ordering: Apply the `For you`(3rd) / `Getting started`(4th) swap ONLY when intent is `TRACK_WORKSPACE` (keep existing order for Manage team).
- Workspace source: `NVP_ACTIVE_POLICY_ID` (same as Manage team).
- Intent detection: treat intent as `TRACK_WORKSPACE` only.

## TDD Plan

### Phase 1 - Tests First (must fail initially)

Add new describe block `TRACK_WORKSPACE intent` in `[tests/unit/hooks/useGettingStartedItems.test.ts](tests/unit/hooks/useGettingStartedItems.test.ts)`:

- Visibility rules:
  - Returns empty when intent is `TRACK_WORKSPACE` but `NVP_ACTIVE_POLICY_ID` is missing.
  - Returns empty when intent is `TRACK_WORKSPACE`, policy exists, but more than 60 days have passed since `NVP_FIRST_DAY_FREE_TRIAL`.
  - Returns empty when intent is `TRACK_WORKSPACE` and user is not a policy admin.
  - Returns empty when intent is `TRACK_WORKSPACE` and the active policy is not a paid group policy (e.g. personal policy).
  - Returns items when intent is `TRACK_WORKSPACE`, within 60 days, policy admin on a paid group policy.
  - Returns items when `introSelected?.choice` is undefined but `onboardingPurpose === TRACK_WORKSPACE` (fallback parity with Manage team).
- Items and check states (`shouldShowSection = true`, three items in order `createWorkspace`, `customizeCategories`, `inviteAccountant`):
  - `createWorkspace` is always `isComplete: true` even when no workspace exists/pending.
  - `customizeCategories` route resolves to `ROUTES.WORKSPACE_CATEGORIES.getRoute(POLICY_ID)`.
  - `customizeCategories` `isComplete: false` with only default categories; `true` with a non-default category in `POLICY_CATEGORIES`.
  - `customizeCategories` is still rendered (not replaced by `connectAccounting`) when the policy has an accounting integration connected - Track branch skips the `isAccountingEnabled` split.
  - `createWorkspace` route resolves to `ROUTES.WORKSPACE_INITIAL.getRoute(POLICY_ID, ...)` on narrow layout and `ROUTES.WORKSPACE_OVERVIEW.getRoute(POLICY_ID)` on wide layout (matches Manage team).
  - `inviteAccountant` route resolves to `ROUTES.WORKSPACE_MEMBERS.getRoute(POLICY_ID)`.
  - `inviteAccountant` `isComplete: false` with 1 member, `true` with >=2 entries in `policy.employeeList`.
  - `inviteAccountant` ignores `employeeList` entries with `pendingAction === DELETE` when counting members.
- Regression:
  - Existing `MANAGE_TEAM` cases still return the manage-team items (unchanged).

Add a minimal render test for mobile ordering. First check if a home-page test file already exists (e.g. under `tests/unit/pages/`) and extend it; only create a new file if none exists:

- When intent is `TRACK_WORKSPACE` and narrow layout is on, `ForYouSection` renders before `GettingStartedSection`.
- When `introSelected?.choice` is undefined but `onboardingPurpose === TRACK_WORKSPACE` and narrow layout is on, the swap still applies (intent source parity).
- When intent is `MANAGE_TEAM` and narrow layout is on, `GettingStartedSection` still renders before `ForYouSection` (unchanged).

### Phase 2 - Minimal Implementation

1. Extend `[src/pages/home/GettingStartedSection/hooks/useGettingStartedItems.ts](src/pages/home/GettingStartedSection/hooks/useGettingStartedItems.ts)`:
  - Replace the single-intent early return with an intent switch; if `intent` is neither `MANAGE_TEAM` nor `TRACK_WORKSPACE`, return empty. Intent resolution stays `introSelected?.choice ?? onboardingPurpose`.
  - For `TRACK_WORKSPACE`:
    - Reuse the same guard stack as Manage team: `activePolicyID` present, `policy` present, `!isPendingDeletePolicy(policy)`, `isPaidGroupPolicy(policy)`, `isPolicyAdmin(policy)`.
    - Reuse `isWithinGettingStartedPeriod(firstDayFreeTrial)` for the 60-day/active-trial window.
    - Track branch always builds `customizeCategories` - it does NOT go through the `isAccountingEnabled` -> `connectAccounting` split that Manage team uses.
    - Build items (exactly three, in order):
      - `createWorkspace`: `isComplete: true`, route `shouldUseNarrowLayout ? ROUTES.WORKSPACE_INITIAL.getRoute(activePolicyID, Navigation.getActiveRoute()) : ROUTES.WORKSPACE_OVERVIEW.getRoute(activePolicyID)` (matches Manage team pattern).
      - `customizeCategories`: `isComplete: hasCustomCategories(policyCategories)`, route `ROUTES.WORKSPACE_CATEGORIES.getRoute(activePolicyID)`, with `isFeatureEnabled: policy.areCategoriesEnabled` and `enableFeature` calling `enablePolicyCategories` so tapping the row auto-enables categories (mirrors Manage team logic).
      - `inviteAccountant`: `isComplete: Object.values(policy?.employeeList ?? {}).filter((member) => member?.pendingAction !== CONST.RED_BRICK_ROAD_PENDING_ACTION.DELETE).length >= 2`, route `ROUTES.WORKSPACE_MEMBERS.getRoute(activePolicyID)`.
  - Keep `MANAGE_TEAM` branch untouched.
  - Optional refactor: extract a shared `useOnboardingIntent()` hook returning `introSelected?.choice ?? onboardingPurpose`, and use it in both this hook and `HomePage.tsx`.
2. Add translation key `inviteAccountant` to `homePage.gettingStartedSection` in EN and ES only:
  - `[src/languages/en.ts](src/languages/en.ts)`: `inviteAccountant: 'Invite your accountant'`.
  - `[src/languages/es.ts](src/languages/es.ts)`: generate the Spanish translation (JaimeGPT-style) and add it to the matching section.
  - Do NOT edit other locale files in this PR.
3. Update `[src/pages/home/HomePage.tsx](src/pages/home/HomePage.tsx)` mobile layout:
  - Read both `introSelected` (via `useOnyx(ONYXKEYS.NVP_INTRO_SELECTED)`) and `onboardingPurpose` (via `useOnyx(ONYXKEYS.ONBOARDING_PURPOSE_SELECTED)`), or use the shared `useOnboardingIntent()` helper if added. Compute `intent = introSelected?.choice ?? onboardingPurpose` so this stays in lockstep with `useGettingStartedItems`.
  - In the narrow-layout branch, when `intent === CONST.ONBOARDING_CHOICES.TRACK_WORKSPACE`, render `ForYouSection` before `GettingStartedSection`. Otherwise preserve the existing order (`GettingStartedSection` then `ForYouSection`).
  - Desktop right-column order is unchanged.

### Phase 3 - Refactor

- If the intent branching in `useGettingStartedItems.ts` grows, extract per-intent builders (e.g., `buildManageTeamItems`, `buildTrackWorkspaceItems`) for readability - no behavior change.
- Ensure `GettingStartedRow`'s existing `navigateToItem` handles the `createWorkspace`-always-checked row gracefully (current rendering hides the arrow icon when complete; confirm via snapshot/interaction test).

### Phase 4 - Regression and Edge Cases

- Custom category with `pendingAction === DELETE` does not count (already handled by `hasCustomCategories`).
- Default categories from `CONST.POLICY.DEFAULT_CATEGORIES` do not count.
- Member count uses `policy.employeeList` keys; verify owner-only policy returns 1 member and stays unchecked.
- Add tests for the 60-day boundary: day 60 inclusive shows, day 61 hides (matches `SIXTY_DAYS_MS`).
- Verify no regression to mobile ordering for non-Track intents by ensuring the default branch runs.

## Decision Log (No Hidden Decisions)

1. Decision: Mobile ordering swap is conditional on intent.
  - Options considered: (a) conditional on Track, (b) universal swap, (c) no change.
  - Chosen option: (a) conditional on Track.
  - Source: User answer.
  - Confirmation needed: No.
2. Decision: Workspace used for checks and navigation is `NVP_ACTIVE_POLICY_ID`.
  - Options considered: active policy, first owned paid policy, onboarding policy ID.
  - Chosen option: `NVP_ACTIVE_POLICY_ID`.
  - Source: User answer.
  - Confirmation needed: No.
3. Decision: Intent detection uses `TRACK_WORKSPACE` only.
  - Options considered: `TRACK_WORKSPACE` only, or include `PERSONAL_SPEND`.
  - Chosen option: `TRACK_WORKSPACE` only.
  - Source: User answer.
  - Confirmation needed: No.
4. Decision: Reuse `isWithinGettingStartedPeriod(firstDayFreeTrial)` (60-day window from trial start) for Track visibility.
  - Options considered: New helper mirroring `shouldShowTrialEndedUI`, or reuse existing helper.
  - Chosen option: Reuse existing helper - it already encodes "within 60 days from trial start" which covers both new sign-ups and active trials as specified in the issue.
  - Source: Cross-validation of current `useGettingStartedItems` implementation; matches Manage team semantics.
  - Confirmation needed: No.
5. Decision: Enforce `isPaidGroupPolicy` guard for Track (same guard stack as Manage team).
  - Options considered: Enforce paid group policy, or allow any admin policy.
  - Chosen option: Enforce paid group policy - consistent with Manage team, avoids personal-policy edge cases where `areCategoriesEnabled`/`enablePolicyCategories` do not apply. The Track workspace auto-created by `autoCreateTrackWorkspace` is a group policy so this does not exclude valid Track users.
  - Source: Cross-validation.
  - Confirmation needed: No.
6. Decision: `Create a workspace` row remains visually always-checked, navigating to the active workspace overview (matches Manage team behavior).
  - Options considered: Hide the row entirely, or always checked.
  - Chosen option: Always checked (issue explicitly calls this out).
  - Source: Issue.
  - Confirmation needed: No.
7. Decision: Intent source in `HomePage.tsx` mobile ordering matches `useGettingStartedItems` - `introSelected?.choice ?? onboardingPurpose`.
  - Options considered: Use `introSelected?.choice` only, or mirror the hook's fallback.
  - Chosen option: Mirror the hook's fallback to avoid transient mismatch where items render as Track but section order does not swap.
  - Source: Cross-validation.
  - Confirmation needed: No.

## Validation Checklist

- Every plan step maps to an explicit requirement or confirmed decision.
- Tests are listed before implementation tasks (TDD).
- All decisions (1-7) are finalized; no pending confirmations.
- Open questions were raised and answered before finalizing.
- No changes to Manage team behavior or desktop layout.
- EN and ES locale files updated with the new `inviteAccountant` key (CI will fail otherwise). Other locales intentionally left for a follow-up.

## Files Touched

- [src/pages/home/GettingStartedSection/hooks/useGettingStartedItems.ts](src/pages/home/GettingStartedSection/hooks/useGettingStartedItems.ts)
- [src/pages/home/HomePage.tsx](src/pages/home/HomePage.tsx)
- [src/languages/en.ts](src/languages/en.ts)
- [src/languages/es.ts](src/languages/es.ts)
- [tests/unit/hooks/useGettingStartedItems.test.ts](tests/unit/hooks/useGettingStartedItems.test.ts)
- (optional) new [tests/unit/pages/HomePage.test.tsx](tests/unit/pages/HomePage.test.tsx) for mobile ordering (extend an existing home-page test file if present)
- (optional) new shared hook `src/hooks/useOnboardingIntent.ts` if the intent-resolution refactor is taken

