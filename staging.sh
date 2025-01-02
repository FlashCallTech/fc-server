#!/bin/bash

# Check if the current branch is 'staging'
if [ "$VERCEL_GIT_COMMIT_REF" != "staging" ]; then
  echo "Skipping deploy for branch $VERCEL_GIT_COMMIT_REF"
  exit 0  # Exits the script and skips the deployment
fi

# If it's the 'staging' branch, continue with the deployment
echo "Deploying to staging branch"

# Run the build process to generate the .next folder
echo "Building the app..."
npm install
npm run build


# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Build completed successfully"
else
  echo "Build failed"
  exit 1  # Exit with a non-zero status to indicate failure
fi

