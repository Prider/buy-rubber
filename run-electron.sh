#!/bin/bash

# Punsook Innotech - Electron Development Runner
# This script helps you run the Electron desktop application in development mode

echo "🚀 Starting Punsook Innotech Desktop Application..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install || npm install
    echo ""
fi

# Check if database exists
if [ ! -f "prisma/dev.db" ]; then
    echo "🗄️  Setting up database..."
    yarn db:push || npm run db:push
    echo ""
    echo "🌱 Seeding database with initial data..."
    yarn db:seed || npm run db:seed
    echo ""
fi

# Start the application
echo "✨ Launching application..."
echo ""
yarn dev || npm run dev

