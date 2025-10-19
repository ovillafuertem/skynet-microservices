#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
svc=${1:-}
if [ -z "$svc" ]; then
  echo "Uso: scripts/shell.sh <servicio>"
  exit 1
fi
docker compose exec "$svc" /bin/sh || docker compose exec "$svc" /bin/bash
