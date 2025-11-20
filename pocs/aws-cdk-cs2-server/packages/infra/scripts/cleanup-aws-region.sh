#!/usr/bin/env bash
set -euo pipefail

REGION="sa-east-1"

echo "----------------------------------------------"
echo " AWS CLEANUP FOR REGION: $REGION"
echo "----------------------------------------------"

confirm() {
  read -p "$1 (y/n): " choice
  case "$choice" in 
    y|Y ) return 0 ;;
    * ) return 1 ;;
  esac
}

#########################################
# 1. DELETE API GATEWAYS
#########################################

APIS=$(aws apigateway get-rest-apis --region $REGION --query "items[].id" --output text)

if [ -n "$APIS" ]; then
  echo "Found API Gateways:"
  echo "$APIS"
  if confirm "Delete ALL API Gateways above?"; then
    for api in $APIS; do
      echo "Deleting API Gateway: $api"
      aws apigateway delete-rest-api --rest-api-id "$api" --region $REGION
    done
  fi
else
  echo "No API Gateways found."
fi

#########################################
# 2. DELETE CLOUDFORMATION STACKS
#########################################

STACKS=$(aws cloudformation list-stacks \
  --region $REGION \
  --query "StackSummaries[?StackStatus=='CREATE_FAILED' || StackStatus=='ROLLBACK_COMPLETE' || StackStatus=='DELETE_FAILED'].StackName" \
  --output text)

if [ -n "$STACKS" ]; then
  echo "Found CloudFormation stacks to delete:"
  echo "$STACKS"
  if confirm "Delete ALL stacks above?"; then
    for st in $STACKS; do
      echo "Deleting stack: $st"
      aws cloudformation delete-stack --stack-name "$st" --region $REGION
    done
  fi
else
  echo "No CloudFormation stacks to delete."
fi

#########################################
# 3. DELETE ECR REPOSITORIES
#########################################

REPOS=$(aws ecr describe-repositories --region $REGION --query "repositories[].repositoryName" --output text || true)
if [ -n "$REPOS" ]; then
  echo "Found ECR repositories:"
  echo "$REPOS"
  if confirm "Delete ALL ECR repositories above (force)?"; then
    for repo in $REPOS; do
      echo "Deleting ECR repository: $repo"
      aws ecr delete-repository --repository-name "$repo" --force --region $REGION || true
    done
  fi
else
  echo "No ECR repos to delete."
fi

#########################################
# 4. DELETE LAMBDA FUNCTIONS
#########################################

LAMBDAS=$(aws lambda list-functions --region $REGION --query "Functions[].FunctionName" --output text)

if [ -n "$LAMBDAS" ]; then
  echo "Found Lambda functions:"
  echo "$LAMBDAS"
  if confirm "Delete ALL Lambda functions above?"; then
    for fn in $LAMBDAS; do
      echo "Deleting Lambda: $fn"
      aws lambda delete-function --function-name "$fn" --region $REGION
    done
  fi
else
  echo "No Lambda functions found."
fi

#########################################
# 5. DELETE DYNAMODB TABLES
#########################################

TABLES=$(aws dynamodb list-tables --region $REGION --query "TableNames[]" --output text)

if [ -n "$TABLES" ]; then
  echo "Found DynamoDB tables:"
  echo "$TABLES"
  if confirm "Delete ALL DynamoDB tables above?"; then
    for tb in $TABLES; do
      echo "Deleting DynamoDB table: $tb"
      aws dynamodb delete-table --table-name "$tb" --region $REGION
    done
  fi
else
  echo "No DynamoDB tables found."
fi

#########################################
# 6. DELETE S3 BUCKETS (ONLY IF EMPTY)
#########################################

BUCKETS=$(aws s3api list-buckets --query "Buckets[].Name" --output text)

if [ -n "$BUCKETS" ]; then
  echo "Found S3 buckets (all regions):"
  echo "$BUCKETS"
  if confirm "Attempt to delete EMPTY buckets in $REGION?"; then
    for b in $BUCKETS; do
      REGION_B=$(aws s3api get-bucket-location --bucket "$b" --query "LocationConstraint" --output text)

      if [ "$REGION_B" == "None" ]; then REGION_B="us-east-1"; fi

      if [ "$REGION_B" == "$REGION" ]; then
        echo "Checking bucket: $b"
        if aws s3 ls "s3://$b" --region $REGION | grep -q .; then
          echo "Bucket not empty, skipping: $b"
        else
          echo "Deleting empty bucket: $b"
          aws s3 rb "s3://$b" --region $REGION || true
        fi
      fi
    done
  fi
else
  echo "No S3 buckets found."
fi

#########################################
# 7. DELETE CLOUDWATCH LOG GROUPS
#########################################

LOGS=$(aws logs describe-log-groups --region $REGION --query "logGroups[].logGroupName" --output text)

if [ -n "$LOGS" ]; then
  echo "Found CloudWatch Log Groups:"
  echo "$LOGS"
  if confirm "Delete ALL log groups above?"; then
    for lg in $LOGS; do
      echo "Deleting log group: $lg"
      aws logs delete-log-group --log-group-name "$lg" --region $REGION || true
    done
  fi
else
  echo "No CloudWatch logs found."
fi

echo "----------------------------------------------"
echo " Cleanup finished for region $REGION"
echo "----------------------------------------------"
