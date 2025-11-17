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
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1 ||   aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" >/dev/null

echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

echo "Building docker image (amd64)..."
docker build --platform=linux/amd64 -t $IMAGE packages/docker

echo "Tagging image..."
docker tag $IMAGE:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$IMAGE:latest

echo "Pushing to ECR..."
docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$IMAGE:latest

echo "Done: $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$IMAGE:latest"
