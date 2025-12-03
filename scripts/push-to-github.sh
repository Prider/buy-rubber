#!/bin/bash

# Script to setup PostgreSQL, commit changes, and push to GitHub
# This script will:
# 1. Run setup:postgres to update .env and schema.prisma
# 2. Check for changes
# 3. Commit the changes
# 4. Push to GitHub

set -e

echo "🚀 Starting GitHub push process..."

# Step 1: Run setup:postgres
echo "📦 Running setup:postgres..."
npm run setup:postgres

# Step 2: Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ ERROR: Not a git repository!"
    exit 1
fi

# Step 3: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Step 4: Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo "ℹ️  No changes to commit. Everything is up to date."
    exit 0
fi

# Step 5: Show status
echo "📋 Changes detected:"
git status --short

# Step 6: Add changes
echo "➕ Adding changes to staging..."
git add .env
git add prisma/schema.prisma

# Check if there are other changes
if ! git diff --cached --quiet; then
    echo "📝 Staged changes:"
    git diff --cached --name-only
fi

# Step 7: Commit changes
COMMIT_MESSAGE="chore: update PostgreSQL configuration and schema

- Updated .env with PostgreSQL configuration
- Updated schema.prisma to use PostgreSQL provider
- Generated Prisma client"

echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Step 8: Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push origin "$CURRENT_BRANCH"; then
    echo "✅ Successfully pushed to GitHub!"
    echo "📍 Branch: $CURRENT_BRANCH"
else
    echo "❌ ERROR: Failed to push to GitHub!"
    echo "💡 You may need to set upstream branch or check your remote configuration."
    exit 1
fi

echo "✅ All done! Changes have been pushed to GitHub."

