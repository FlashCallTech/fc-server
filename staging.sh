#!/bin/bash
echo "Running script for branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" != "staging" ]; then
  echo "Skipping deploy for branch $VERCEL_GIT_COMMIT_REF"
  exit 0
fi

echo "Deploying to staging branch"
