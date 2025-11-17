#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "===================================================="
echo " 🚀 CS2 FULL DEPLOY SCRIPT"
echo "===================================================="
echo ""

ROOT=$(pwd)

# ------------------------------------------------------
# Load .env.deploy
# ------------------------------------------------------
if [ ! -f .env.deploy ]; then
  echo "❌ ERROR: .env.deploy not found."
  exit 1
fi

echo "🔧 Loading environment from .env.deploy..."
source .env.deploy

if [ -z "${AWS_ACCOUNT_ID:-}" ] || [ -z "${AWS_REGION:-}" ]; then
  echo "❌ ERROR: AWS_ACCOUNT_ID and AWS_REGION must be set in .env.deploy"
  exit 1
fi

export REGION="${AWS_REGION}"

echo "AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID"
echo "AWS_REGION     = $AWS_REGION"
echo ""

# ------------------------------------------------------
# Validate AWS CLI
# ------------------------------------------------------
echo "🔍 Checking AWS CLI credentials..."
aws sts get-caller-identity >/dev/null || {
  echo "❌ ERROR: AWS CLI is not configured. Run: aws configure"
  exit 1
}

echo "✔ AWS CLI OK"
echo ""

# ------------------------------------------------------
# Bootstrap check
# ------------------------------------------------------
echo "🔍 Checking CDK bootstrap bucket..."

BOOTSTRAP_BUCKET="cdk-hnb659fds-assets-${AWS_ACCOUNT_ID}-${AWS_REGION}"

if aws s3 ls "s3://${BOOTSTRAP_BUCKET}" >/dev/null 2>&1; then
  echo "✔ CDK bootstrap already exists: ${BOOTSTRAP_BUCKET}"
else
  echo "⚠ Bootstrap not found. Running CDK bootstrap..."
  cd packages/infra
  npx cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION}
  cd "$ROOT"
  echo "✔ Bootstrap complete"
fi

echo ""

# ------------------------------------------------------
# Install dependencies
# ------------------------------------------------------
echo "📦 Installing dependencies..."
pnpm install
echo "✔ Dependencies installed"
echo ""

# ------------------------------------------------------
# Build Lambda
# ------------------------------------------------------
echo "🛠 Building Lambda..."
pnpm --filter @cs2/control-lambda build
echo "✔ Lambda built"
echo ""

# ------------------------------------------------------
# Build Infra (TS to JS)
# ------------------------------------------------------
echo "🛠 Building Infra..."
pnpm --filter @cs2/infra build
echo "✔ Infra built"
echo ""

# ------------------------------------------------------
# Build & Push Docker Image
# ------------------------------------------------------
echo "🐳 Building & pushing Docker image to ECR..."
./scripts/build-and-push-ecr.sh
echo "✔ Docker image pushed to ECR"
echo ""

# ------------------------------------------------------
# Deploy CDK Stacks
# ------------------------------------------------------
echo "🚀 Deploying CDK stacks..."
cd packages/infra

npx cdk deploy --all --require-approval never

echo ""
echo "===================================================="
echo " 🎉 DEPLOY COMPLETE!"
echo "===================================================="
echo ""
