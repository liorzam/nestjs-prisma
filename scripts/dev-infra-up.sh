#!/usr/bin/env bash
# Start local Postgres and Redis for development (see docker-compose.yml).
# Invoked by package.json `prepare` (after install) and `pnpm run infra:up`.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but not installed." >&2
  exit 1
fi

docker compose up -d --wait
echo "Postgres and Redis are up (healthchecks passed)."
