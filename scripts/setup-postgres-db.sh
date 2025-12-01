#!/bin/bash

# Script to setup PostgreSQL database schema (for local PostgreSQL or production)

echo "🔧 Setting up PostgreSQL database..."

# Backup and update .env file
# if [ -f .env ]; then
#     echo "Backing up current .env to .env.local..."
#     cp .env .env.local
# fi

echo "Creating/updating .env file for PostgreSQL..."
cat > .env << 'EOF'
# Neon Development with PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_mz5dI9aqiPTg@ep-patient-dawn-a1bhnxtm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Secret
JWT_SECRET="your-secret-key-change-this-in-production"

# App
NEXT_PUBLIC_APP_NAME="BigLatex-Pro"
NEXT_PUBLIC_APP_VERSION="1.0.0"

NODE_ENV="development"
SKIP_ENV_VALIDATION="true"
EOF

echo "✅ .env updated for PostgreSQL"

# Copy PostgreSQL schema
if [ -f prisma/schema.postgres.prisma ]; then
    echo "Copying PostgreSQL schema..."
    cp prisma/schema.postgres.prisma prisma/schema.prisma
else
    echo "⚠️  PostgreSQL schema file not found!"
    echo "You may need to manually change the provider in schema.prisma to 'postgresql'"
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
npm run db:seed

echo "✅ PostgreSQL database setup complete!"
echo ""
echo "Make sure your .env file contains a valid PostgreSQL DATABASE_URL:"
echo '  DATABASE_URL="postgresql://user:password@localhost:5432/mydb"'
echo ""
echo "Or for Neon:"
echo '  DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"'

