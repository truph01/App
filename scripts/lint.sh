#!/bin/bash

# Run ESLint with the repo's standard flags (memory ceiling, shared content
# cache, auto concurrency). Delegate target selection to the caller:
#
#   ./scripts/lint.sh                 -> lint the whole repo
#   ./scripts/lint.sh src/foo.ts ...  -> lint just the given paths

set -euo pipefail

# Disable the wrapper's cache flags when ESLint caching is explicitly disabled.
use_cache=true
for arg in "$@"; do
    if [[ "$arg" == "--no-cache" ]]; then
        use_cache=false
        break
    fi
done

# Preserve the old default of linting the whole repo when no target is passed.
if [[ "$#" -eq 0 ]]; then
    set -- .
fi

# Build ESLint args so cache flags can be conditionally omitted.
eslint_args=()
if [[ "$use_cache" == "true" ]]; then
    eslint_args+=(
        --cache
        --cache-location=node_modules/.cache/eslint
        --cache-strategy content
    )
fi
eslint_args+=(
    --concurrency=auto
    --no-warn-ignored
    "$@"
)

# Run ESLint with the repo's default memory ceiling and seatbelt behavior.
NODE_OPTIONS="${NODE_OPTIONS:---max_old_space_size=8192}" \
SEATBELT_FROZEN="${SEATBELT_FROZEN:-0}" \
    exec npx eslint "${eslint_args[@]}"
