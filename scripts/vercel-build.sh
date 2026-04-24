#!/bin/bash

# Vercel Build Script
# This script ensures proper database setup during Vercel deployment

set -e

echo "🔧 Starting Vercel build process..."

# Use WASM SWC to avoid native binary download issues
export NEXT_PRIVATE_SKIP_SWC_NATIVE_DOWNLOAD=1

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Database setup (optional in CI/build environments)
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL is not set - skipping schema push and seed."
    echo "If your deployment requires DB migrations/seed at build time,"
    echo "set DATABASE_URL in Vercel project environment variables."
else
    echo "✅ DATABASE_URL is set"

    # Step 3: Push database schema (create/update tables)
    echo "📊 Pushing database schema..."
    if npx prisma db push --skip-generate --accept-data-loss; then
        echo "✅ Schema pushed successfully"
    else
        echo "⚠️  Warning: Schema push failed, but continuing build..."
    fi

    # Step 4: Seed database (only if not already seeded)
    echo "🌱 Checking if database needs seeding..."
    if npx prisma db seed; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database might already be seeded or seed failed, continuing build..."
    fi
fi

# Step 5: Build Next.js application
echo "🏗️  Building Next.js application..."
npm run web:build

echo "✅ Vercel build completed successfully!"

