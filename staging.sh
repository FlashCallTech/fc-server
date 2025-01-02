#!/bin/bash

# Check if the current branch is 'staging'
if [ "$VERCEL_GIT_COMMIT_REF" != "staging" ]; then
  echo "Skipping deploy for branch $VERCEL_GIT_COMMIT_REF"
  exit 0  # Exits the script and skips the deployment
fi

# If it's the 'staging' branch, continue with the deployment
echo "Deploying to staging branch"

# Step 1: Clean the workspace
echo "Cleaning up previous builds..."
rm -rf .next node_modules

# Step 2: Install dependencies
echo "Installing dependencies..."
npm install

# Step 3: Install missing ESLint
if ! [ -d "./node_modules/eslint" ]; then
  echo "ESLint is missing. Installing ESLint..."
  npm install --save-dev eslint
fi

# Step 4: Check and add missing TypeScript definitions for 'react-slick'
if ! [ -d "./node_modules/@types/react-slick" ]; then
  echo "Missing types for 'react-slick'. Adding custom type declaration..."
  mkdir -p types
  echo "declare module 'react-slick' {
    const Slider: any;
    export default Slider;
  }" > types/react-slick.d.ts
fi

# Step 5: Run linting (Optional: Skip linting if you want to bypass it)
echo "Linting the project..."
npx eslint . --ext .js,.jsx,.ts,.tsx || {
  echo "Linting failed. Please fix the errors."
  exit 1
}

# Step 6: Build the app
echo "Building the app..."
npm run build

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Build completed successfully"
else
  echo "Build failed"
  exit 1  # Exit with a non-zero status to indicate failure
fi
