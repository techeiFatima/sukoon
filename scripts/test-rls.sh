#!/usr/bin/env bash
# Spins up a throwaway local Postgres, applies the migration on top of a
# minimal Supabase stub, and runs the RLS test suite.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v postgres 2>/dev/null || ls /usr/lib/postgresql/*/bin/postgres | tail -1)")}"
TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP"; RUN_AS=(runuser -u postgres --); fi
cleanup() { "${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
"${RUN_AS[@]}" "$PGBIN/initdb" -D "$TMP/data" -U postgres >/dev/null
"${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null
P=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -q -v ON_ERROR_STOP=1)
"${RUN_AS[@]}" "${P[@]}" -f "$ROOT/supabase/tests/supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${RUN_AS[@]}" "${P[@]}" -f "$f"; done
"${RUN_AS[@]}" "${P[@]}" -f "$ROOT/supabase/tests/rls_test.sql"
