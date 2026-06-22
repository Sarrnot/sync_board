#!/usr/bin/env bash
# PostToolUse hook: format + lint + test the single file Claude just edited.
# Fast, file-scoped checks. Typecheck runs over the whole codebase (too slow
# per edit) and is handled by the Stop hook instead.
#
# ESLint covers every TS file. Non-TS files (markdown, json) and build output
# are skipped.
set -euo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Never touch build output or deps.
case "$file" in
    */node_modules/* | */dist/*) exit 0 ;;
esac

# Route the file to its owning app by directory. Match any TS file under the app
# (eslint's config decides what it can type-check); skip everything else.
case "$file" in
    */apps/web/*.ts | */apps/web/*.tsx) app="web" ;;
    */apps/server/*.ts) app="server" ;;
    *) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

# Mark that this session actually edited app code, so the Stop hook knows to run
# the whole-codebase checks. A dirty tree alone isn't enough — it can't tell a
# real code change from a pre-existing diff during a brainstorm-only turn.
# Lives in .git/ so it's never committed and never shows in `git status`.
touch "$root/.git/claude-needs-check"

# Format first — prettier owns style (eslint-config-prettier disables style
# rules). Prettier is repo-global.`.
if ! output=$(cd "$root" && pnpm run format "$file" 2>&1); then
    echo "Format failed for $file:" >&2
    echo "$output" >&2
    exit 2
fi

# Then lint with the owning app's type-aware config.
if ! output=$(cd "$root" && pnpm --filter "$app" lint:file "$file" 2>&1); then
    echo "Lint failed for $file:" >&2
    echo "$output" >&2
    exit 2
fi

# Finally, run only this file's colocated test. Edit a test => run itself; edit
# a source file => run its sibling "<name>.test.<ext>" if one exists. No test
# file => no-op (cross-file breakage is caught by the full suite in the Stop hook).
case "$file" in
    *.test.ts | *.test.tsx) test_file="$file" ;;
    *.ts) test_file="${file%.ts}.test.ts" ;;
    *.tsx) test_file="${file%.tsx}.test.tsx" ;;
    *) test_file="" ;;
esac

if [ -n "$test_file" ] && [ -f "$test_file" ]; then
    if ! output=$(cd "$root" && pnpm --filter "$app" test "$test_file" 2>&1); then
        echo "Tests failed for $test_file:" >&2
        echo "$output" >&2
        exit 2
    fi
fi

exit 0
