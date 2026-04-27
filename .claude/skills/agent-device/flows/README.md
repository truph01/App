# Flows

Composable `.ad` snippets - one screen of work, callable as a unit. Each flow advertises machine-matchable metadata (`@pre`, `@post`, `@param`, `@tag`) via `# @`-prefixed comment headers, so an agent can pick the right one from a snapshot.

## Agent decision loop

Before manually navigating, use this human-in-the-loop loop:

1. `agent-device snapshot -i` - see current state.
2. `grep -H '^# @' .claude/skills/agent-device/flows/*.ad` - full catalog in one read.
3. For each candidate flow, run `agent-device is exists "<selector>"` per `@pre`. Keep flows where every `@pre` passes.
4. Filter by `@param` against the user's stated intent (email, account_state, ...). Mismatch = skip.
5. Rank survivors by goal closeness (`@post` overlap with the requested destination) and present top candidates to the user with a short "why this flow" note.
6. Wait for user selection before replaying. **Auto-run is allowed only when there is exactly one survivor and its `@param` exactly matches an explicit user request** (for example, "sign me in as returning user").
7. `agent-device replay <path>`.
8. Verify each `@post` with `is exists`. On success, re-enter the loop only if the user's stated goal is not complete; otherwise stop and report completion. On failure, propose peer flow/manual fallback options and ask before continuing.

## Metadata header spec

Each flow starts with `# @key value` comment lines. The `.ad` parser treats `#` lines as no-ops, so headers cost nothing at replay time.

| Field    | Cardinality | Value                                                                                            |
| -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `@desc`  | 1           | One-line human summary.                                                                          |
| `@pre`   | 1..N        | Selector that must resolve in the current snapshot. Multiple lines are ANDed.                    |
| `@post`  | 1..N        | Selector expected after replay. Multiple lines are ANDed. Used for chaining + success.           |
| `@param` | 0..N        | `name=value` baked-in constant. Value may be literal, wildcard (`*@x.com`), or regex (`/^.+$/`). |
| `@tag`   | 0..N        | Free-form category (`auth`, `onboarding`, ...) or scoped (`sentry-<spanName>`).                  |

Selector syntax matches the body: `id="..."`, `role="..." label="..."`, `text="..."`, `||` for fallbacks.

## Parametrization (`agent-device` v0.13.0+)

Lift body literals to named variables. Decouples a flow's *intent* (`@param`) from its *interpolated values* (`env`).

| Construct          | Where                | Purpose                                                                          |
| ------------------ | -------------------- | -------------------------------------------------------------------------------- |
| `env KEY=VALUE`    | Header (after `# @`) | File-level default. Quote values with spaces or `||` chains: `env KEY="a || b"`. |
| `${KEY}`           | Body                 | Interpolation point. Resolves at replay time.                                    |
| `${KEY:-fallback}` | Body                 | Use `fallback` if `KEY` is unset.                                                |
| `\${KEY}`          | Body                 | Literal `${KEY}` (escape).                                                       |

Resolution precedence (high to low): CLI `-e KEY=VALUE` (repeatable) > shell `AD_KEY=...` (auto-imported, prefix stripped) > file `env` > built-ins (`AD_PLATFORM`, `AD_SESSION`, `AD_FILENAME`, `AD_DEVICE`, `AD_ARTIFACTS`). Unresolved `${X}` errors with `file:line`.

Override at runtime without editing the file:

```bash
agent-device replay <flow>.ad -e EMAIL=other@example.com
```

## Authoring rules

- **No `open`, no `close`, no `context` header.** Caller owns lifecycle.
- **No fixed `wait` calls.** `fill`/`press` resolve selectors with retry. Only add `wait <selector>` for real post-action blocks.
- **Durable selectors.** Prefer `id=...` first, then `role=... label=...`, with `||` fallbacks. Avoid `@eN` refs.
- **Every flow declares `@desc`, `@pre`, `@post`.** `@param` and `@tag` when applicable.
- **Peers share `@pre` and differ on `@param`/`@post`.** One flow per narrow outcome is better than a mega-flow with conditional branches.
- **`@param` and `env` go together for substituted values.** If a `@param` value is interpolated into the body, declare a matching `env` default with the same literal and reference it as `${VAR}`. `@param` is the routing hint; `env` is the runtime-overridable source of truth. Routing-only params (e.g. `account_state=new`) need no `env`.

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

Re-verify `@pre`/`@post` still hold, then commit. Note: `replay -u` is rejected when the script declares `env` directives (rewrite would drop them); strip the `env` block manually before healing, then re-add it.
