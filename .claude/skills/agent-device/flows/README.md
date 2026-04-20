# Flows

Deterministic `.ad` recordings for repeatable steps.

```bash
agent-device replay .claude/skills/agent-device/flows/<name>.ad
```

## Index

| Flow                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `sign-in.ad`             | Sign in with the shared test account.               |
| `complete-onboarding.ad` | Tap through onboarding to land on home.             |

## Recording a new flow

```bash
agent-device record start
# drive the flow manually while --save-script writes the .ad
agent-device record stop
mv <generated>.ad .claude/skills/agent-device/flows/<name>.ad
```

## Maintenance

When a recording stops working because of UI/selector drift:

```bash
agent-device replay -u .claude/skills/agent-device/flows/<name>.ad
```

Verify the updated recording still does the right thing, then commit the delta.
