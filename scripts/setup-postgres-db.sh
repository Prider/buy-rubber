#!/bin/bash

# Setup PostgreSQL / Neon for local web development and Vercel.
# Reads DATABASE_URL and DIRECT_URL from .env — does not overwrite .env.

set -e

echo "🔧 Setting up PostgreSQL database..."

if [ ! -f .env ]; then
    echo "❌ .env not found. Copy env.example to .env and set DATABASE_URL + DIRECT_URL."
    exit 1
fi

if ! grep -qE '^DATABASE_URL=.+(postgresql|postgres)://' .env; then
    echo "❌ DATABASE_URL in .env must be a postgresql:// connection string (Neon pooled URL)."
    exit 1
fi

if ! grep -qE '^DIRECT_URL=.+(postgresql|postgres)://' .env; then
    echo "❌ DIRECT_URL in .env is required for Prisma migrations (Neon unpooled URL, no -pooler)."
    exit 1
fi

if [ ! -f prisma/schema.postgres.prisma ]; then
    echo "❌ prisma/schema.postgres.prisma not found"
    exit 1
fi

echo "Copying PostgreSQL schema..."
cp prisma/schema.postgres.prisma prisma/schema.prisma

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing schema to database..."
npx prisma db push

echo "Seeding database if empty..."
node scripts/seed-if-empty.js

echo "✅ PostgreSQL database setup complete!"
echo ""
echo "For Vercel, set these environment variables in the project dashboard:"
echo "  DATABASE_URL  — Neon pooled URL (hostname contains -pooler)"
echo "  DIRECT_URL    — Neon unpooled URL (same host without -pooler)"
echo "  JWT_SECRET    — production JWT secret"
