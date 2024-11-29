#!/bin/bash

# Check if the current branch is not 'staging'
if [ "$VERCEL_GIT_COMMIT_REF" != "staging" ]; then
  echo "Skipping deploy for branch $VERCEL_GIT_COMMIT_REF"
  exit 0  # Exits the script and skips the deployment
fi

# If it's the 'staging' branch, continue with the deployment (optional)
echo "Deploying to staging branch"
