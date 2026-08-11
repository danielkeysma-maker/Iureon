#!/usr/bin/env bash
#
# Enforces the project's 500-line ceiling for source files under backend/src
# and frontend/src. See PROJECT_GUIDE.md.
set -euo pipefail

LIMIT=500
violations=0

while IFS= read -r file; do
  lines=$(wc -l < "$file")

  if [ "$lines" -gt "$LIMIT" ]; then
    echo "  $file: $lines lines (limit $LIMIT)"
    violations=$((violations + 1))
  fi
done < <(find backend/src frontend/src \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.css' \) \
  -type f)

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "$violations file(s) exceed the $LIMIT-line ceiling. Split them by responsibility."
  exit 1
fi

echo "All source files are within the $LIMIT-line ceiling."
