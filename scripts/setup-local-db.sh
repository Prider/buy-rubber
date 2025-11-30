#!/bin/bash

# Script to setup local SQLite database for development
# This is useful if you want to use SQLite locally instead of PostgreSQL

echo "🔧 Setting up local SQLite database..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo 'DATABASE_URL="file:./dev.db"' > .env
    echo "NODE_ENV=development" >> .env
else
    echo "⚠️  .env file already exists"
    echo "Make sure it contains: DATABASE_URL=\"file:./dev.db\""
fi

# Backup current schema
if [ -f prisma/schema.prisma ]; then
    echo "Backing up current schema to schema.postgres.prisma..."
    cp prisma/schema.prisma prisma/schema.postgres.prisma
fi

# Copy SQLite schema
if [ -f prisma/schema.sqlite.prisma ]; then
    echo "Copying SQLite schema..."
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
else
    echo "⚠️  SQLite schema file not found!"
    echo "You may need to manually change the provider in schema.prisma to 'sqlite'"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push

# Seed database
echo "Seeding database..."
npm run db:seed:local

echo "✅ Local SQLite database setup complete!"
echo ""
echo "You can now run:"
echo "  npm run dev          - Start development server"
echo "  npm run db:studio    - Open Prisma Studio"

