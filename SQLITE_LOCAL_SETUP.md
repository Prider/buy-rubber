# Using SQLite for Local Development

This guide explains how to set up and use SQLite for local development instead of PostgreSQL.

---

## Quick Setup

Run this single command to set up SQLite:

```bash
npm run setup:sqlite
```

Or:

```bash
npm run setup:local
```

This will:
1. ✅ Backup your current PostgreSQL schema (if needed)
2. ✅ Switch schema to SQLite
3. ✅ Create/update `.env` file with SQLite connection
4. ✅ Generate Prisma client
5. ✅ Create database and push schema
6. ✅ Seed database with initial data

---

## What Gets Changed

### 1. Prisma Schema
- Switches from `provider = "postgresql"` to `provider = "sqlite"`
- Uses existing `schema.sqlite.prisma` if available, otherwise converts current schema

### 2. Environment File (`.env`)
- Sets `DATABASE_URL="file:./prisma/dev.db"`
- Backs up existing `.env` to `.env.backup`

### 3. Database File
- Creates `prisma/dev.db` (SQLite database file)

---

## After Setup

Once setup is complete, you can:

```bash
# Start development server
npm run dev

# Open Prisma Studio to view/edit data
npm run db:studio

# Run database migrations (if needed)
npm run db:push
```

---

## Switching Back to PostgreSQL

To switch back to PostgreSQL for production or testing:

```bash
npm run setup:postgres
```

Or manually:
1. Restore `.env.backup` to `.env`
2. Update `prisma/schema.prisma` to use PostgreSQL
3. Run `npx prisma generate`
4. Run `npx prisma db push`

---

## Database Location

SQLite database file:
```
prisma/dev.db
```

This file contains all your local development data. You can:
- ✅ Copy it to backup your data
- ✅ Delete it to start fresh
- ✅ Share it with team members (if needed)

---

## Benefits of SQLite for Local Development

- ✅ **No setup required** - No need to install/configure PostgreSQL
- ✅ **Fast** - Single file database, very fast for local development
- ✅ **Portable** - Easy to backup and share
- ✅ **Works offline** - No database server needed
- ✅ **Perfect for Electron** - Ideal for desktop app development

---

## Production

**Important:** For production (Vercel), you should use PostgreSQL:
- The schema will be set to PostgreSQL automatically
- Vercel uses Neon PostgreSQL database
- SQLite is only for local development

---

## Troubleshooting

### "Database file is locked"
- Close Prisma Studio if it's open
- Close any other connections to the database
- Try again

### "Schema validation error"
- Make sure you're using the correct schema file
- Run `npx prisma generate` again

### "Can't find database"
- Run `npm run setup:sqlite` again
- Check that `prisma/dev.db` exists

---

## Quick Reference

| Task | Command |
|------|---------|
| **Setup SQLite** | `npm run setup:sqlite` |
| **Start dev server** | `npm run dev` |
| **View database** | `npm run db:studio` |
| **Reset database** | Delete `prisma/dev.db` and run `npm run setup:sqlite` |
| **Switch to PostgreSQL** | `npm run setup:postgres` |

---

## Files

- `scripts/setup-sqlite-local.js` - Setup script (cross-platform)
- `prisma/schema.sqlite.prisma` - SQLite schema (if exists)
- `prisma/dev.db` - SQLite database file (created after setup)
- `.env` - Environment configuration

