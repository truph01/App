#!/bin/bash

# Run ESLint with the repo's standard flags (memory ceiling, shared content
# cache, auto concurrency). Delegate target selection to the caller:
#
#   ./scripts/lint.sh                 -> lint the whole repo
#   ./scripts/lint.sh src/foo.ts ...  -> lint just the given paths

set -euo pipefail

use_cache=true
for arg in "$@"; do
    if [[ "$arg" == "--no-cache" ]]; then
        use_cache=false
        break
    fi
done

if [[ "$#" -eq 0 ]]; then
    set -- .
fi

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

NODE_OPTIONS="${NODE_OPTIONS:---max_old_space_size=8192}" \
SEATBELT_FROZEN="${SEATBELT_FROZEN:-0}" \
    exec npx eslint "${eslint_args[@]}"
