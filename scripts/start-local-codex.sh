#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -z "${DOCKER_BIN:-}" ]; then
  if command -v docker >/dev/null 2>&1; then
    DOCKER_BIN="$(command -v docker)"
  else
    DOCKER_BIN="/Applications/Docker.app/Contents/Resources/bin/docker"
  fi
fi
PROXY_PORT="${CODEX_OPENAI_PROXY_PORT:-52032}"
CODEX_OPENAI_HOST="${CODEX_OPENAI_HOST:-host.docker.internal}"
export AITOEARN_HTTP_PORT="${AITOEARN_HTTP_PORT:-18080}"
export AITOEARN_RUSTFS_PORT="${AITOEARN_RUSTFS_PORT:-19000}"
export AITOEARN_RUSTFS_CONSOLE_PORT="${AITOEARN_RUSTFS_CONSOLE_PORT:-19001}"
export AITOEARN_MONGODB_PORT="${AITOEARN_MONGODB_PORT:-27018}"
export AITOEARN_REDIS_PORT="${AITOEARN_REDIS_PORT:-6380}"
LOCAL_DIR="$ROOT_DIR/.local"
PROXY_LOG="$LOCAL_DIR/codex-openai-proxy.log"
PROXY_PID="$LOCAL_DIR/codex-openai-proxy.pid"

mkdir -p "$LOCAL_DIR"

if ! "$DOCKER_BIN" info >/dev/null 2>&1; then
  if command -v colima >/dev/null 2>&1; then
    colima start
  else
    open -a Docker
  fi
  for _ in {1..60}; do
    if "$DOCKER_BIN" info >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

if ! "$DOCKER_BIN" info >/dev/null 2>&1; then
  echo "Docker Desktop is not running or not ready." >&2
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
  CODEX_OPENAI_PROXY_PORT="$PROXY_PORT" node "$ROOT_DIR/scripts/codex-openai-proxy.mjs" >"$PROXY_LOG" 2>&1 &
  echo "$!" > "$PROXY_PID"
  for _ in {1..20}; do
    if curl -fsS "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! curl -fsS "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
  echo "Codex OpenAI proxy did not become healthy. See $PROXY_LOG" >&2
  exit 1
fi

cd "$ROOT_DIR"
CODEX_OPENAI_PROXY_PORT="$PROXY_PORT" CODEX_OPENAI_HOST="$CODEX_OPENAI_HOST" "$DOCKER_BIN" compose \
  -f docker-compose.yml \
  -f docker-compose.codex.yml \
  up -d

echo "AiToEarn is starting with local ports:"
echo "  Web: http://localhost:$AITOEARN_HTTP_PORT"
echo "  RustFS proxy: http://localhost:$AITOEARN_RUSTFS_PORT"
echo "  RustFS console: http://localhost:$AITOEARN_RUSTFS_CONSOLE_PORT"
echo "  MongoDB: localhost:$AITOEARN_MONGODB_PORT"
echo "  Redis: localhost:$AITOEARN_REDIS_PORT"
echo "  Codex proxy: http://127.0.0.1:$PROXY_PORT"
echo "Codex OpenAI proxy log: $PROXY_LOG"
