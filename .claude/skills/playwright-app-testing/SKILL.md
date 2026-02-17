---
name: playwright-app-testing
description: Test the Expensify App using Playwright browser automation. Use when user requests browser testing, after making frontend changes, or when debugging UI issues
alwaysApply: false
---

# Playwright App Testing

## When to Use This Skill

Use Playwright testing when:
- User requests testing the App in a browser
- Verifying fixes or improvements you've made to UI/frontend code
- Debugging UI issues

**Proactively use after making frontend changes** to verify your work functions correctly.

## Prerequisites Check

Before using Playwright tools, verify the dev server is running:
```bash
ps aux | grep "webpack" | grep -v grep
```

**If server not running**: Inform user to start with `cd App && npm run web`

## Dev Server Details
- **URL**: `https://dev.new.expensify.com:8082/`
- **Location**: HOST machine (not inside VM)
- **Start command**: `cd App && npm run web`

## Playwright Testing Workflow

1. **Verify server**: Check webpack process is running
2. **Navigate**: Use `browser_navigate` to `https://dev.new.expensify.com:8082/`
3. **Interact**: Use browser MCP tools including:
   - **Inspection**: `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`
   - **Interaction**: `browser_click`, `browser_type`, `browser_fill_form`, `browser_hover`
   - **Navigation**: `browser_navigate_back`, `browser_tabs`, `browser_wait_for`
   - All other browser tools as needed

## Speed Optimization: No Pre-Waiting

**CRITICAL**: Do NOT add arbitrary waits (`browser_wait_for` with a time) after actions like clicks, fills, or navigation. Instead, follow this pattern:

1. **Perform the action** (click, type, fill, etc.)
2. **Immediately take a snapshot** (`browser_snapshot`) to check the result.
3. **If the page appears unchanged** (same elements, same URL), wait 1 second and snapshot again.
4. **Repeat up to 3 times** with 1-second waits if needed.

## Dev Environment Sign-In

When signing in to dev environment:
- **Email**: Generate random Gmail address (e.g., `user+throwaway<random>@gmail.com`)
- **Magic code**: Always `000000` (six zeros)
- **Onboarding**: Skip all optional steps

## Example Usage

```
Scenario 1: User requests testing
User: "Test sign in to app"
→ Use this skill to verify server and test sign-in flow

Scenario 2: After making UI changes
You: "I've updated the expense form validation"
→ Proactively use this skill to verify the changes work in browser

Scenario 3: Investigating bug
User: "The submit button doesn't work on this page"
→ Use this skill to reproduce and verify the issue
```

## When NOT to Use This Skill

Skip Playwright for:
- Backend service testing
- Unit tests
- Type checking
- Mobile native app testing (requires emulators/simulators)
