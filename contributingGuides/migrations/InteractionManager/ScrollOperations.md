# Scroll Operations

Refer to [README.md](./README.md) for more information what's the overall strategy and why we're migrating away from `InteractionManager.runAfterInteractions`.

## Strategy

**Use `requestAnimationFrame(() => callback())`**

Scroll operations are layout-dependent and need the current frame's layout to be committed before executing. `requestAnimationFrame(() => callback())` is the correct primitive here — it ensures the scroll happens after the browser/native has painted the current frame.

## Usages

| File                                            | Line | Current                                              | Migration                                                      | PR                                                    |
| ----------------------------------------------- | ---- | ---------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `ReportActionItemEventHandler/index.android.ts` | 7    | `InteractionManager.runAfterInteractions(() => rAF)` | Verify if this is still needed                                 | [#44428](https://github.com/Expensify/App/pull/44428) |
| `FormWrapper.tsx`                               | 199  | Nested `InteractionManager + rAF`                    | Replace with just `requestAnimationFrame(() => scrollToEnd())` | [#79597](https://github.com/Expensify/App/pull/79597) |
| `MoneyRequestReportActionsList.tsx`             | 293  | InteractionManager wrapping load call                | Replace with `requestAnimationFrame(() => loadOlderChats())`   | [#59664](https://github.com/Expensify/App/pull/59664) |
| `MoneyRequestReportActionsList.tsx`             | 514  | InteractionManager wrapping scroll                   | Replace with `requestAnimationFrame(() => scrollToBottom())`   | [#59664](https://github.com/Expensify/App/pull/59664) |
| `ReportActionsList.tsx`                         | 837  | InteractionManager wrapping load call                | Replace with `requestAnimationFrame(() => loadNewerChats())`   | [#49477](https://github.com/Expensify/App/pull/49477) |
| `ReportActionsList.tsx`                         | 494  | Hide counter + scroll to bottom on mount             | Replace with `requestAnimationFrame`                           | [#55350](https://github.com/Expensify/App/pull/55350) |
| `ReportActionsList.tsx`                         | 513  | Safari scroll to bottom for whisper                  | Just remove, no longer needed                                  | [#55350](https://github.com/Expensify/App/pull/55350) |
| `ReportActionsList.tsx`                         | 526  | Scroll to bottom for current user action             | Replace with `requestAnimationFrame`                           | [#52955](https://github.com/Expensify/App/pull/52955) |
| `ReportActionsList.tsx`                         | 617  | Scroll to bottom for IOU error                       | Replace with `requestAnimationFrame`                           | [#58793](https://github.com/Expensify/App/pull/58793) |