# Flows

Composable `.ad` snippets for in-app navigation. A flow drops into an **already-open session** and advances state - it does not launch or close the app. Every flow declares machine-matchable metadata so an agent can pick the right one from a snapshot.

```bash
agent-device replay .claude/skills/agent-device/flows/<name>.ad
```

## Metadata header spec

Each flow starts with `# @key value` comment lines. The `.ad` parser treats `#` lines as no-ops, so headers cost nothing at replay time.

| Field     | Cardinality | Value                                                                                   |
| --------- | ----------- | --------------------------------------------------------------------------------------- |
| `@desc`   | 1           | One-line human summary.                                                                 |
| `@pre`    | 1..N        | Selector that must resolve in the current snapshot. Multiple lines are ANDed.           |
| `@post`   | 1..N        | Selector expected after replay. Multiple lines are ANDed. Used for chaining + success.  |
| `@param`  | 0..N        | `name=value` baked-in constant. Value may be literal, wildcard (`*@x.com`), or regex (`/^.+$/`). |
| `@tag`    | 0..N        | Free-form category (`auth`, `onboarding`, `reports`, ...).                              |

Selector syntax matches the flow body: `id="..."`, `role="..." label="..."`, `text="..."`, with `||` inside a single value for fallbacks.

### Example

```
# @desc   Sign in with the shared agent-device test account; new-account branch.
# @pre    role="textfield" label="Phone or email"
# @pre    role="button" label="Continue"
# @post   text="Welcome"
# @post   role="button" label="Join"
# @param  email=agent-device-testing@gmail.com
# @param  account_state=new
# @tag    auth
fill "id=\"username\" || role=\"textfield\" label=\"Phone or email\" editable=true || label=\"Phone or email\" editable=true" "agent-device-testing@gmail.com"
press "role=\"button\" label=\"Continue\" || label=\"Continue\""
```

## Agent decision loop

Before manually navigating, check the catalog. For each step of an in-app task:

1. `agent-device snapshot -i` to see current state.
2. Discover catalog: `grep -H '^# @' .claude/skills/agent-device/flows/*.ad`.
3. Filter by `@pre`: for each flow, run `agent-device is exists '<selector>'` per `@pre`; keep flows where every pre passes.
4. Filter by `@param`: compare each `@param` against the user's stated intent. Mismatch (wrong email, wrong account_state, ...) disqualifies the flow. Wildcards and regex values match as usual.
5. Of the survivors, prefer one whose `@post` moves closer to the goal. Peer flows sharing the same `@pre` (e.g. `sign-in-new` vs `sign-in-returning`) differ only by `@param` and `@post`; try the param-matching one, fall back to the peer if the post-check fails.
6. `agent-device replay <path>`.
7. Run `agent-device is exists` per `@post`; if all pass, re-enter the loop for the next step. If any fails, either try the peer flow or proceed manually.

## Index

| Flow                      | `@param`                                  | Lands on                                  |
| ------------------------- | ----------------------------------------- | ----------------------------------------- |
| `sign-in-new.ad`          | `account_state=new`                       | Welcome / Join screen.                    |
| `sign-in-returning.ad`    | `account_state=returning`                 | Home.                                     |
| `complete-onboarding.ad`  | `purpose=something_else`, `first_name=Agent`, `last_name=Device` | Home.            |

Headers are authoritative. The table above is a quick scan only.

**Known gap:** between `sign-in-new.ad` (lands at Welcome/Join) and `complete-onboarding.ad` (starts at onboarding step 1, "What's your work email?") there is one manual tap on the Join button. Chain as: `sign-in-new.ad` -> manual `press 'role="button" label="Join"'` -> `complete-onboarding.ad`. Add a `join-new-account.ad` one-press flow if this becomes routine.

## Authoring rules

- **No `open`, no `close`, no `context` header.** Caller owns lifecycle.
- **No fixed `wait` calls.** `fill`/`press` resolve selectors with retry. Only add `wait <selector>` for real post-action blocks.
- **Durable selectors.** Prefer `id=...` first, then `role=... label=...`, with `||` fallbacks. Avoid `@eN` refs.
- **Every flow declares `@desc`, `@pre`, `@post`.** `@param` and `@tag` when applicable.
- **Peers share `@pre` and differ on `@param`/`@post`.** One flow per narrow outcome is better than a mega-flow with conditional branches.

## Recording a new flow

1. Drive the target screen manually.
2. Start a session with `--save-script`:
   ```bash
   agent-device open <app> --save-script .claude/skills/agent-device/flows/<name>.ad
   ```
3. Perform the steps.
4. `agent-device close` - flushes the `.ad`.
5. Edit the generated file:
   - Delete the `context` line, leading `open ... --relaunch`, trailing `close`, and eyeballing `wait`s.
   - Add `@desc`, `@pre`, `@post`, `@param`, `@tag` headers.
6. Verify: pre-check from a matching state, replay, post-check.

## Maintenance

Heal selector drift in place:

```bash
agent-device replay -u .claude/skills/agent-device/flows/<name>.ad
```

Re-verify `@pre`/`@post` still hold, then commit.
