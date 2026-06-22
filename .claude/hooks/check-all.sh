#!/usr/bin/env bash
# Stop hook: thorough whole-codebase checks after Claude finishes.
# Runs typecheck (tsc --noEmit) then the full test suite over the entire
# repo — both too slow/broad to run per edit. Lint and file-scoped tests are
# already enforced per file on edit, so no full lint is needed here.
set -euo pipefail

input=$(cat)

# true when this Stop was itself triggered by a previous blocked Stop hook,
# i.e. Claude already had one attempt to fix things.
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

# Skip the whole-codebase checks unless the edit hook actually touched app code
# this session. A brainstorm-only turn — even on a dirty tree — leaves no marker.
marker="$root/.git/claude-needs-check"
if [ ! -e "$marker" ]; then
    exit 0
fi

# Block on the first failure, but never block twice for the same reason (that
# would loop forever): once stop_hook_active is set, surface and allow the stop.
fail() {
    local label=$1 output=$2
    if [ "$active" = "true" ]; then
        rm -f "$marker" # Giving up — clear the marker so a later brainstorm Stop doesn't re-run.
        echo "$label STILL failing after a fix attempt — allowing stop to avoid an infinite loop. Fix manually:" >&2
        echo "$output" >&2
        exit 1
    fi
    # Keep the marker: the retry Stop should re-run these checks.
    echo "$label failed:" >&2
    echo "$output" >&2
    exit 2
}

if ! output=$(cd "$root" && pnpm -r typecheck 2>&1); then
    fail "Typecheck" "$output"
fi

if ! output=$(cd "$root" && pnpm -r test 2>&1); then
    fail "Tests" "$output"
fi

rm -f "$marker" # All green — consume the marker so the next Stop is a no-op until code changes.
exit 0
