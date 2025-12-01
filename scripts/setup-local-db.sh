#!/bin/bash

# Script to setup local SQLite database for development
# This is useful if you want to use SQLite locally instead of PostgreSQL

echo "🔧 Setting up local SQLite database..."

# # Backup and update .env file
# if [ -f .env ]; then
#     echo "Backing up current .env to .env.local..."
#     cp .env .env.local
# fi

echo "Creating/updating .env file for SQLite..."
cat > .env << 'EOF'
# Local Development with SQLite
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-secret-key-change-this-in-production"

# App
NEXT_PUBLIC_APP_NAME="BigLatex-Pro"
NEXT_PUBLIC_APP_VERSION="1.0.0"

NODE_ENV="development"
SKIP_ENV_VALIDATION="true"
EOF

echo "✅ .env updated for SQLite"

# # Backup current schema
# if [ -f prisma/schema.prisma ]; then
#     echo "Backing up current schema to schema.postgres.prisma..."
#     cp prisma/schema.prisma prisma/schema.postgres.prisma
# fi

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

