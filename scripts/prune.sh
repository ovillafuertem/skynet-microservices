#!/usr/bin/env bash
set -euo pipefail
read -r -p "Esto eliminará recursos no usados (dangling). ¿Continuar? [y/N] " resp
if [[ "$resp" =~ ^[Yy]$ ]]; then
  docker system prune -f
fi
