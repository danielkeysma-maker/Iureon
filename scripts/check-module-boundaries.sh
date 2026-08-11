#!/usr/bin/env bash
#
# Enforces the module boundaries that keep this codebase maintainable.
# Replaces the old 500-line ceiling, which measured size rather than coupling:
# a 400-line isolated file is fine, a 200-line one that reaches into another
# module's internals is not.
set -uo pipefail

failed=0

report() {
  echo "$1"
  failed=1
}

# ---------------------------------------------------------------------------
# 1. Domain types must not be imported from another module's component file.
#    Types belong in <module>/types.ts so a module never depends on foreign UI
#    just to describe its own state. Importing a component to compose it is
#    ordinary React and stays allowed.
# ---------------------------------------------------------------------------
cross_component=$(grep -rnE "^import type .* from '.*(\.\./)+[a-z-]+/components/[A-Z][A-Za-z]*'" \
  frontend/src --include='*.ts' --include='*.tsx' 2>/dev/null || true)

if [ -n "$cross_component" ]; then
  report "A module imports a type from another module's component file. Move it into <module>/types.ts:"
  echo "$cross_component"
fi

# ---------------------------------------------------------------------------
# 2. Only the API layer may call fetch. Components and views go through a
#    module service, so no component knows a URL or the tenant header.
# ---------------------------------------------------------------------------
stray_fetch=$(grep -rn "fetch(" frontend/src --include='*.tsx' 2>/dev/null || true)

if [ -n "$stray_fetch" ]; then
  report "fetch() called from a component. Move the call into <module>/services/*.api.ts:"
  echo "$stray_fetch"
fi

# ---------------------------------------------------------------------------
# 3. The Supabase client is created once, in config/supabase.config.ts.
# ---------------------------------------------------------------------------
clients=$(grep -rn "createClient(" backend/src --include='*.ts' 2>/dev/null \
  | grep -v 'config/supabase.config.ts' || true)

if [ -n "$clients" ]; then
  report "Supabase client created outside config/supabase.config.ts:"
  echo "$clients"
fi

# ---------------------------------------------------------------------------
# 4. Backend route files wire routes; business logic lives in a service.
#    A controller importing Supabase directly means the layering slipped.
# ---------------------------------------------------------------------------
fat_controllers=$(grep -rln "supabase" backend/src/modules --include='*.controller.ts' 2>/dev/null || true)

if [ -n "$fat_controllers" ]; then
  report "Controller talks to Supabase directly. Move data access into the module's service:"
  echo "$fat_controllers"
fi

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Module boundaries violated. See PROJECT_GUIDE.md for the module contract."
  exit 1
fi

echo "Module boundaries hold."
