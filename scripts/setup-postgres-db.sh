#!/bin/bash

# Script to setup PostgreSQL database schema (for local PostgreSQL or production)

echo "🔧 Setting up PostgreSQL database..."

# Restore PostgreSQL schema if backup exists
if [ -f prisma/schema.postgres.prisma ]; then
    echo "Restoring PostgreSQL schema..."
    cp prisma/schema.postgres.prisma prisma/schema.prisma
else
    echo "PostgreSQL schema is already active or doesn't exist"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "Pushing schema to database..."
npx prisma db push

# Seed database
echo "Seeding database..."
npm run db:seed

echo "✅ PostgreSQL database setup complete!"
echo ""
echo "Make sure your .env file contains a valid PostgreSQL DATABASE_URL:"
echo '  DATABASE_URL="postgresql://user:password@localhost:5432/mydb"'
echo ""
echo "Or for Neon:"
echo '  DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"'

