# Flows

Deterministic `.ad` recordings for repeatable steps. Invoke a flow **only** when the developer asks for the corresponding action - do not snapshot-match and auto-pick.

```bash
agent-device replay .claude/skills/agent-device/flows/<name>.ad
```

## Index

| Flow                    | Purpose                                              | Assumes                          | End state                              |
| ----------------------- | ---------------------------------------------------- | -------------------------------- | -------------------------------------- |
| `sign-in.ad`            | Sign in with the shared test account (magic code `000000`) | App is open and on the login screen, user is logged out | Either home/LHN, or onboarding if new account |
| `complete-onboarding.ad` | Tap through onboarding to reach home                | User is signed in and on onboarding | Home/LHN                               |

## Test account

`sign-in.ad` uses a shared test email baked into the recording. Current placeholder: `agent-device+qa@expensify.com` (magic code is always `000000` in dev). Revisit once the flow is recorded against the real app - we may want a dynamic-selection mechanism then.

## Recording a new flow

```bash
agent-device record start
# drive the flow manually while --save-script writes the .ad
agent-device record stop
mv <generated>.ad .claude/skills/agent-device/flows/<name>.ad
```

Each flow must be:
- **Idempotent to enter**: the recorded trigger UI is on screen before replay starts, otherwise fail fast.
- **Terminal to exit**: the end state is distinct from the trigger, so chained replays don't oscillate.

## Maintenance

When a recording stops working because of UI/selector drift:

```bash
agent-device replay -u .claude/skills/agent-device/flows/<name>.ad
```

Verify the updated recording still does the right thing, then commit the delta.
