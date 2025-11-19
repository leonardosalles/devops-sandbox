#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
source .env.deploy

if [ -z "${AWS_ACCOUNT_ID:-}" ] || [ -z "${AWS_REGION:-}" ] || [ -z "${DOCKER_IMAGE_NAME:-}" ]; then
  echo "Please set AWS_ACCOUNT_ID, AWS_REGION and DOCKER_IMAGE_NAME in .env.deploy"
  exit 1
fi

REPO_NAME=${DOCKER_IMAGE_NAME}
ACCOUNT=${AWS_ACCOUNT_ID}
REGION=${AWS_REGION}
IMAGE=${REPO_NAME}

echo "Ensure ECR repository exists..."
aws ecr describe-repositories \
  --repository-names "$REPO_NAME" \
  --region "$REGION" >/dev/null 2>&1 || \
  aws ecr create-repository \
    --repository-name "$REPO_NAME" \
    --region "$REGION" >/dev/null

echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin \
    $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

echo "Enabling docker buildx..."
docker buildx create --use >/dev/null 2>&1 || true
docker buildx inspect --bootstrap >/dev/null

echo "Building docker image (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  -t $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$IMAGE:latest \
  --push \
  packages/cs2-server

echo "Done: $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$IMAGE:latest"
