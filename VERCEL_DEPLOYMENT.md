# Vercel Deployment Guide

This guide explains how to deploy your application to Vercel with Neon PostgreSQL database.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A Neon database account (sign up at https://neon.tech)

## Step 1: Set Up Neon Database

1. Go to https://neon.tech and create a new project
2. Once created, copy the connection string from your Neon dashboard
3. The connection string format will be:
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Configure Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your application:
   ```bash
   vercel
   ```

4. Set environment variable:
   ```bash
   vercel env add DATABASE_URL
   ```
   Paste your Neon connection string when prompted.

### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com and import your GitHub repository
2. In the project settings, add the following environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string (from Step 1)

## Step 3: Build Configuration

The project is already configured with the correct build settings:

- **Build Command**: `npm run vercel-build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

These settings are defined in `vercel.json` and `package.json`.

## Step 4: Deploy

After setting up the environment variables, Vercel will automatically:
1. Generate Prisma Client
2. Push the database schema to your Neon database
3. Seed the database with initial data
4. Build your Next.js application

## Local Development with PostgreSQL (Optional)

If you want to use PostgreSQL locally instead of SQLite:

1. Install PostgreSQL locally or use a local Docker instance
2. Update your local `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   ```
3. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Local Development with SQLite

To continue using SQLite for local development:

1. Keep your local `.env` file with SQLite connection:
   ```
   DATABASE_URL="file:./dev.db"
   ```
2. Use the local seed script:
   ```bash
   npm run db:seed:local
   ```

## Environment Variables Reference

### Production (Vercel)
```
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
NODE_ENV="production"
```

### Local Development (SQLite)
```
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

## Scripts Reference

- `npm run dev` - Start development server with Prisma generation
- `npm run build` - Build for production with database setup
- `npm run vercel-build` - Vercel-specific build command
- `npm run db:seed` - Seed database (uses DATABASE_URL from env)
- `npm run db:seed:local` - Seed local SQLite database
- `npm run db:studio` - Open Prisma Studio to view/edit data

## Troubleshooting

### Build fails on Vercel
- Check that DATABASE_URL is correctly set in Vercel environment variables
- Ensure your Neon database is accessible (check firewall/connection settings)
- Review build logs in Vercel dashboard

### Prisma migration issues
- For Vercel deployments, `prisma db push` is used instead of migrations
- This allows schema updates without migration files
- For production with multiple environments, consider using `prisma migrate deploy`

### Database connection errors
- Verify your Neon connection string includes `?sslmode=require`
- Check that your Neon database is in an active state
- Ensure you're using the correct connection pooling URL if needed

