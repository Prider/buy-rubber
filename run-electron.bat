@echo off
REM Yang Dee - Electron Development Runner for Windows
REM This script helps you run the Electron desktop application in development mode

echo 🚀 Starting Yang Dee Desktop Application...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call yarn install || call npm install
    echo.
)

REM Check if database exists
if not exist "prisma\dev.db" (
    echo 🗄️  Setting up database...
    call yarn db:push || call npm run db:push
    echo.
    echo 🌱 Seeding database with initial data...
    call yarn db:seed || call npm run db:seed
    echo.
)

REM Start the application
echo ✨ Launching application...
echo.
call yarn dev || call npm run dev

pause

