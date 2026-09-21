#!/bin/bash

# Vercel Build Script
# Generate Prisma for PostgreSQL, sync schema, then build Next.js.

set -e

echo "🔧 Starting Vercel build process..."

export NEXT_PRIVATE_SKIP_SWC_NATIVE_DOWNLOAD=1

# Vercel / web always uses PostgreSQL (Electron copies the SQLite schema separately).
if [ -f prisma/schema.postgres.prisma ]; then
    echo "🐘 Using PostgreSQL Prisma schema..."
    cp prisma/schema.postgres.prisma prisma/schema.prisma
else
    echo "❌ prisma/schema.postgres.prisma not found"
    exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL is not set - skipping schema push and seed."
    echo "Set DATABASE_URL (pooled Neon URL) and DIRECT_URL (unpooled Neon URL) in Vercel env vars."
else
    echo "✅ DATABASE_URL is set"

    echo "📊 Pushing database schema..."
    if npx prisma db push --skip-generate; then
        echo "✅ Schema pushed successfully"
    else
        echo "⚠️  Warning: Schema push failed, but continuing build..."
    fi

    echo "🌱 Seeding database if empty..."
    if node scripts/seed-if-empty.js; then
        echo "✅ Seed check complete"
    else
        echo "⚠️  Seed check failed, continuing build..."
    fi
fi

echo "🏗️  Building Next.js application..."
npm run web:build

echo "✅ Vercel build completed successfully!"
