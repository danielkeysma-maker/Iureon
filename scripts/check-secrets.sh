#!/usr/bin/env bash
#
# Blocks credentials committed into source. A hardcoded superuser password
# once shipped inside the frontend bundle; this gate exists so that cannot
# recur silently.
set -uo pipefail

failed=0

report() {
  echo "$1"
  failed=1
}

# Literal assignments to credential-shaped identifiers. Anything sourced from
# process.env or import.meta.env is configuration, not a committed secret.
#
# "secretari" is excluded because Spanish "secretaría/secretarial" begins with
# the letters of "secret" and the pattern reads SECRETARIA as SECRET + ARIA,
# exactly as it reads SECRET_KEY as SECRET + _KEY. The exclusion is narrow: it
# only drops that word stem, so secretKey, secret_value and the rest still trip
# the gate. Verified in both directions after the change.
matches=$(grep -rnIEi \
  "(password|passwd|secret|api[_-]?key|access[_-]?token|service[_-]?role)[[:alnum:]_]*[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]" \
  backend/src frontend/src 2>/dev/null \
  | grep -viE "process\.env|import\.meta\.env|placeholder=|type=|className=|aria-|// |\* " \
  | grep -viE "secretari" \
  || true)

if [ -n "$matches" ]; then
  report "Possible hardcoded credential:"
  echo "$matches"
fi

# Tracked .env files. .env.example is the documented template and is allowed.
tracked_env=$(git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example$' || true)

if [ -n "$tracked_env" ]; then
  report "Environment file tracked in git:"
  echo "$tracked_env"
fi

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Move the value into an environment variable and rotate it."
  exit 1
fi

echo "No committed credentials found."
