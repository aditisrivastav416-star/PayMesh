#!/usr/bin/env bash
set -euo pipefail
umask 077

data="${PAYMESH_DB_DATA_DIR:-$HOME/.local/share/paymesh/postgres}"
port="${PAYMESH_DB_PORT:-5433}"
password="${PAYMESH_DB_PASSWORD:-paymesh}"

case "${1:-}" in
  start)
    if [ ! -f "$data/PG_VERSION" ]; then
      mkdir -p "$(dirname "$data")"
      printf '%s\n' "$password" > "${data}-password"
      chmod 600 "${data}-password"
      initdb -D "$data" --username=paymesh --auth-host=scram-sha-256 --auth-local=scram-sha-256 --pwfile="${data}-password" >/dev/null
    fi
    if [ -f "${data}-password" ]; then chmod 600 "${data}-password"; fi
    if ! pg_ctl -D "$data" status >/dev/null 2>&1; then
      pg_ctl -D "$data" -o "-h 127.0.0.1 -p $port -k /private/tmp" -l "${data}.log" start
    fi
    if ! PGPASSWORD="$password" psql -h 127.0.0.1 -p "$port" -U paymesh -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = 'paymesh'" | grep -qx 1; then
      PGPASSWORD="$password" psql -h 127.0.0.1 -p "$port" -U paymesh -d postgres -c 'CREATE DATABASE paymesh' >/dev/null
    fi
    pg_isready -h 127.0.0.1 -p "$port"
    ;;
  stop)
    if [ -f "$data/PG_VERSION" ]; then pg_ctl -D "$data" stop; fi
    ;;
  *)
    echo "Usage: bash scripts/db.sh start|stop" >&2
    exit 2
    ;;
esac
