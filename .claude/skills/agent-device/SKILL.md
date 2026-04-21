---
name: agent-device
description: Drive iOS and Android devices for the Expensify App - testing, debugging, performance profiling, bug reproduction, and feature verification. Use when the developer needs to interact with the mobile app on a device.
allowed-tools: Bash(agent-device *) Bash(npm root *)
---

# agent-device

## Pre-flight

`agent-device` CLI version: !`agent-device --version 2>&1 || echo "NOT_INSTALLED"`

Canonical skill reference path (read these files directly for device automation guidance - bootstrap, exploration, verification, debugging): !`echo "$(npm root -g)/agent-device/skills/agent-device"`

> If the version line above shows `NOT_INSTALLED` or a command-not-found error, **STOP** and instruct the developer to install it: `npm install -g agent-device`. All device interaction depends on it.

## Dev prerequisites

Default assumption: dev build from this repo. Before `open <app>`, both must be true:

1. **Metro dev server** running: `npm run start` (background).
2. **Dev build installed** on target: `npm run ios` or `npm run android` from the repo root.

Skip these only when the developer explicitly targets a non-dev build (e.g., standalone/prod artifact, or a pre-installed release build).

## Flows

Repeatable steps (sign-in, onboarding, etc.) are captured as composable `.ad` snippets under [`flows/`](flows/README.md). Each flow advertises machine-matchable metadata (`@pre`, `@post`, `@param`, `@tag`) via `# @`-prefixed comment headers. Before manually tapping through a screen, check the catalog:

1. `agent-device snapshot -i` - see current state.
2. `grep -H '^# @' .claude/skills/agent-device/flows/*.ad` - full catalog in one read.
3. For each candidate flow, run `agent-device is exists '<selector>'` per `@pre`. Keep only flows where every `@pre` passes.
4. Filter by `@param` against the user's stated intent (email, account_state, ...). Mismatch = skip.
5. Prefer a survivor whose `@post` moves closer to the user's goal. For peer flows that share `@pre` (e.g. `sign-in-new` vs `sign-in-returning`), pick the one whose `@param` matches user context; fall back to the peer if the post-check fails.
6. `agent-device replay <path>`.
7. Verify each `@post` with `is exists`. On success, re-enter the loop for the next step. On failure, try the peer flow or proceed manually.

See [`flows/README.md`](flows/README.md) for the full header spec and authoring rules.

## Misc

- To skip onboarding, set `SKIP_ONBOARDING=true` in `.env`.
