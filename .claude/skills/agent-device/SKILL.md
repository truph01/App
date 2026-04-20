---
name: agent-device
description: Drive iOS and Android devices for the Expensify App - testing, debugging, performance profiling, bug reproduction, and feature verification. Use when the developer needs to interact with the mobile app on a device.
---

# agent-device

## Pre-flight Check

Verify the `agent-device` CLI is installed and its skills are accessible:

```bash
agent-device --version
```

If missing, **STOP** and instruct the user to install it:

```bash
npm install -g agent-device
```

The `agent-device` CLI ships with built-in skills under `skills/` in the installed package. These contain the canonical reference for device automation - bootstrap, exploration, verification, debugging, and more. Use `agent-device --help` to discover available commands and skill names. Read the skill files directly from the installed package path when you need detailed guidance:

```bash
# Find the package location
npm root -g
# Then read: <global_root>/agent-device/skills/agent-device/SKILL.md
```

> **Do not proceed without `agent-device` installed.** All device interaction depends on it.

## Flows

Repeatable steps (sign-in, onboarding, etc.) are captured as `.ad` recordings under [`flows/`](flows/README.md). See the index for what's available and what each one assumes.

**Run a flow only on explicit developer intent** (e.g. "sign in", "get past onboarding"). Do not try to match flows against the current snapshot - pick by what the developer asked for.

```bash
agent-device replay .claude/skills/agent-device/flows/<name>.ad
```

If replay fails because selectors drifted, heal the recording in place and commit the update:

```bash
agent-device replay -u .claude/skills/agent-device/flows/<name>.ad
```

> To skip onboarding entirely (avoid running `complete-onboarding.ad` at all), set `SKIP_ONBOARDING=true` in `.env` and rebuild the app.
