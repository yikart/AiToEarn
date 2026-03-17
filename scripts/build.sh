#!/bin/bash
# 构建所有服务的 Docker 镜像（本地构建，不推送）
# Build all service Docker images (local build, no push)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Building backend images ==="

cd "$PROJECT_ROOT/project/aitoearn-backend"

# 构建 aitoearn-server（不带 -p，不推送到远端）
echo "--- Building aitoearn-server ---"
node scripts/build-docker.mjs aitoearn-server

# 构建 aitoearn-ai
echo "--- Building aitoearn-ai ---"
node scripts/build-docker.mjs aitoearn-ai

# 重新 tag 为 docker-compose 期望的名称
echo "--- Tagging images for docker-compose ---"
docker tag "aitoearn-server:$(docker images aitoearn-server --format '{{.Tag}}' | head -1)" aitoearn/aitoearn-server:latest
docker tag "aitoearn-ai:$(docker images aitoearn-ai --format '{{.Tag}}' | head -1)" aitoearn/aitoearn-ai:latest

echo "=== Building frontend image ==="

cd "$PROJECT_ROOT/project/aitoearn-web"
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080/api \
  -t aitoearn/aitoearn-web:latest .

echo "=== All images built successfully ==="
echo ""
echo "Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "aitoearn|REPOSITORY"
echo ""
echo "Run 'docker compose up -d' to start all services."
