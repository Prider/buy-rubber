# GitHub Commit Guide

This guide explains how to commit and push changes to GitHub for this project.

## Quick Start

To automatically setup PostgreSQL, commit changes, and push to GitHub, simply run:

```bash
npm run push:github
```

This command will:
1. ✅ Run `setup:postgres` to update `.env` and `schema.prisma`
2. ✅ Stage the changes (`.env` and `prisma/schema.prisma`)
3. ✅ Commit with a descriptive message
4. ✅ Push to the current branch on GitHub

## Manual Process

If you prefer to commit manually or need more control, follow these steps:

### 1. Setup PostgreSQL Configuration

First, update your PostgreSQL configuration:

```bash
npm run setup:postgres
```

This will:
- Update `.env` file with PostgreSQL configuration
- Copy `prisma/schema.postgres.prisma` to `prisma/schema.prisma`
- Generate Prisma client
- Push schema to database
- Seed the database

### 2. Check Git Status

Review what files have changed:

```bash
git status
```

### 3. Stage Changes

Add the files you want to commit:

```bash
# Add specific files
git add .env
git add prisma/schema.prisma

# Or add all changes
git add .
```

### 4. Commit Changes

Create a commit with a descriptive message:

```bash
git commit -m "chore: update PostgreSQL configuration and schema

- Updated .env with PostgreSQL configuration
- Updated schema.prisma to use PostgreSQL provider
- Generated Prisma client"
```

**Commit Message Guidelines:**
- Use clear, descriptive messages
- Start with a type prefix: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Use present tense ("add" not "added")
- Keep the first line under 50 characters
- Add details in the body if needed

### 5. Push to GitHub

Push your changes to the remote repository:

```bash
# Push to current branch
git push origin <branch-name>

# Or if upstream is set
git push
```

**Common Branch Names:**
- `main` - Main production branch
- `develop` - Development branch
- `feature/feature-name` - Feature branches

## Important Notes

### ⚠️ Security Considerations

The `.env` file contains sensitive information including:
- Database connection strings
- JWT secrets
- API keys

**Before committing `.env` to GitHub:**
1. ✅ Ensure your repository is private, OR
2. ✅ Remove sensitive values and use placeholders, OR
3. ✅ Use environment variables in your deployment platform (Vercel, etc.)

**Recommended Approach:**
- Keep sensitive values in `.env.local` (which is gitignored)
- Commit a `.env.example` file with placeholder values
- Use environment variables in production deployments

### 📋 Files Typically Committed

When running `setup:postgres`, these files are usually updated:
- `.env` - Environment variables (⚠️ contains sensitive data)
- `prisma/schema.prisma` - Database schema

### 🔄 Before Pushing

Always check:
1. ✅ You're on the correct branch
2. ✅ All tests pass (`npm test`)
3. ✅ Linting passes (`npm run lint`)
4. ✅ No sensitive data is exposed
5. ✅ Commit message is clear and descriptive

## Troubleshooting

### "Not a git repository" Error

If you see this error, make sure you're in the project root directory:

```bash
cd /path/to/biglatex-pro
```

### "Failed to push" Error

Common causes and solutions:

1. **No upstream branch set:**
   ```bash
   git push -u origin <branch-name>
   ```

2. **Authentication issues:**
   - Check your GitHub credentials
   - Use SSH keys or personal access tokens

3. **Remote not configured:**
   ```bash
   git remote -v  # Check remotes
   git remote add origin <repository-url>  # Add if missing
   ```

### "Nothing to commit" Message

This means:
- No changes were made by `setup:postgres`, OR
- Changes were already committed

Check with:
```bash
git status
```

## Best Practices

1. **Always pull before pushing:**
   ```bash
   git pull origin <branch-name>
   ```

2. **Review changes before committing:**
   ```bash
   git diff
   ```

3. **Use meaningful commit messages:**
   - Describe what changed and why
   - Reference issue numbers if applicable

4. **Keep commits focused:**
   - One logical change per commit
   - Don't mix unrelated changes

5. **Test before pushing:**
   ```bash
   npm test
   npm run lint
   ```

## Script Details

The `push:github` script (`scripts/push-to-github.sh`) performs these steps:

1. Runs `npm run setup:postgres`
2. Verifies git repository
3. Shows current branch
4. Checks for changes
5. Stages `.env` and `prisma/schema.prisma`
6. Commits with a standard message
7. Pushes to the current branch

You can customize the script by editing `scripts/push-to-github.sh`.

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

If you encounter issues:
1. Check the error message carefully
2. Review this guide
3. Check git status: `git status`
4. Review git log: `git log --oneline -10`

