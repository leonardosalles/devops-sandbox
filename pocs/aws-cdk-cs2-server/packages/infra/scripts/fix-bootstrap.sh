#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "===================================================="
echo " 🔧 CDK BOOTSTRAP FIX — AWS (sa-east-1)"
echo "===================================================="
echo ""

ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
REGION="sa-east-1"

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ ERROR: You must export AWS_ACCOUNT_ID before running this script."
  echo "   Example: export AWS_ACCOUNT_ID=272411245373"
  exit 1
fi

echo "🧩 Using AWS Account: $ACCOUNT_ID"
echo "🧩 Target Region: $REGION"
echo ""

# ------------------------------------------------------
# Helper: check if a stack exists
# ------------------------------------------------------
stack_exists() {
  local STACK="$1"
  local REGION="$2"
  aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --region "$REGION" >/dev/null 2>&1
}

delete_stack() {
  local STACK="$1"
  local REGION="$2"

  if stack_exists "$STACK" "$REGION"; then
    echo "⚠️  Deleting stack '$STACK' in region $REGION..."
    aws cloudformation delete-stack --stack-name "$STACK" --region "$REGION"
  else
    echo "✔ Stack '$STACK' not found in $REGION (OK)"
  fi
}

wait_delete() {
  local STACK="$1"
  local REGION="$2"

  echo "⏳ Waiting deletion of $STACK in $REGION..."
  while stack_exists "$STACK" "$REGION"; do
    echo "   ...still deleting..."
    sleep 5
  done
  echo "✔ Stack $STACK removed in $REGION"
}

# ------------------------------------------------------
# 1. Delete bootstrap stacks from wrong regions
# ------------------------------------------------------
echo "🔍 Checking CDKToolkit stacks..."

# us-east-1
delete_stack "CDKToolkit" "us-east-1"
wait_delete "CDKToolkit" "us-east-1"

# sa-east-1
delete_stack "CDKToolkit" "$REGION"
wait_delete "CDKToolkit" "$REGION"

echo ""
echo "✔ All existing CDKToolkit stacks removed."
echo ""

# ------------------------------------------------------
# 2. Re-bootstrap the correct region
# ------------------------------------------------------
echo "🚀 Bootstrapping fresh CDK environment..."

cd packages/infra
npx cdk bootstrap aws://$ACCOUNT_ID/$REGION

cd ../..

echo ""
echo "⏳ Validating bootstrap bucket exists..."
BOOTSTRAP_BUCKET="cdk-hnb659fds-assets-${ACCOUNT_ID}-${REGION}"

if aws s3 ls "s3://${BOOTSTRAP_BUCKET}" >/dev/null 2>&1; then
  echo "✔ Bootstrap bucket OK: ${BOOTSTRAP_BUCKET}"
else
  echo "❌ ERROR: Bootstrap bucket was NOT created."
  echo "   Something is wrong with your AWS permissions."
  exit 1
fi

echo ""
echo "===================================================="
echo " 🎉 CDK BOOTSTRAP FIX COMPLETE"
echo "===================================================="
echo ""
echo "You can now safely run:"
echo ""
echo "   cd packages/infra"
echo "   npx cdk deploy --all --require-approval never"
echo ""
