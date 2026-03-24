# Update & Rollback Procedures

Step-by-step procedures for updating and rolling back CineList in production.

## Table of Contents

- [Pre-Update Preparation](#pre-update-preparation)
- [Update Process: Vercel](#update-process-vercel)
- [Update Process: Self-Hosted (VPS)](#update-process-self-hosted-vps)
- [Post-Update Verification](#post-update-verification)
- [Rollback Procedure](#rollback-procedure)

---

## Pre-Update Preparation

### 1. Create database backup

Before any update, always back up the database.

#### Neon (managed backups)

Neon provides automatic point-in-time restore on paid plans. For manual backup:

```bash
# Export database using pg_dump
pg_dump "$DATABASE_URL" --no-owner --no-acls -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup file was created
ls -lh backup_*.dump
```

#### Automated backup script

Use the provided script:

```bash
./scripts/backup.sh
```

This creates a timestamped dump in `backups/` directory.

### 2. Check compatibility

Before updating, verify:

```bash
# Check current deployed version
git describe --tags --always

# Review changes since last deployment
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Check if Prisma schema has changed (requires migration)
git diff $(git describe --tags --abbrev=0)..HEAD -- prisma/schema.prisma

# Review package.json for dependency changes
git diff $(git describe --tags --abbrev=0)..HEAD -- package.json

# Check for breaking changes in CHANGELOG or commit messages
git log --oneline $(git describe --tags --abbrev=0)..HEAD | grep -i "breaking\|BREAKING"
```

### 3. Plan downtime

| Update type | Expected downtime | Notes |
|-------------|-------------------|-------|
| Code-only (no DB changes) | **0 seconds** (Vercel) / **~10 seconds** (VPS) | Vercel does atomic deployments; PM2 does graceful reload |
| With Prisma schema changes | **0–30 seconds** | `prisma db push` is fast for additive changes |
| Major version upgrade | **1–5 minutes** | May require dependency rebuild |

**Vercel deployments are zero-downtime by default** — the old version serves traffic until the new build is complete.

---

## Update Process: Vercel

Vercel deploys automatically on push to `main`. The process is:

### 1. Merge changes to main

```bash
# Ensure all changes are in a feature branch
git checkout main
git pull origin main
git merge feature/your-feature

# Or merge via GitHub PR (recommended)
```

### 2. Vercel auto-deploys

On push to `main`, Vercel automatically:
1. Detects the push
2. Installs dependencies (`npm ci`)
3. Generates Prisma client
4. Builds the app (`next build`)
5. Deploys atomically (old version serves until new is ready)
6. Routes traffic to new deployment

### 3. Run database migrations (if schema changed)

If `prisma/schema.prisma` was modified:

```bash
# Run from local machine or CI with production DATABASE_URL
DATABASE_URL="postgresql://..." npx prisma db push
```

For additive changes (new tables, new columns), this is safe to run while the app is live.

For destructive changes (dropping columns, renaming), coordinate with the deployment:
1. Deploy code that handles both old and new schema
2. Run migration
3. Deploy code that only uses new schema

### 4. Update environment variables (if needed)

In Vercel dashboard: **Settings → Environment Variables** → update values → **Redeploy**.

---

## Update Process: Self-Hosted (VPS)

### 1. Prepare the update

```bash
ssh user@your-server
cd /opt/cinelist

# Record current version for potential rollback
git describe --tags --always > /tmp/cinelist_previous_version
```

### 2. Pull latest code

```bash
git fetch origin
git checkout main
git pull origin main
```

### 3. Install dependencies

```bash
npm ci
```

### 4. Run database migrations (if needed)

```bash
# Check if schema changed
git diff HEAD~1 -- prisma/schema.prisma

# If changed, push schema to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### 5. Build the application

```bash
npm run build
```

### 6. Restart the application

```bash
# Graceful reload (zero-downtime for PM2)
pm2 reload cinelist

# Verify process is running
pm2 status cinelist
```

### 7. Update environment variables (if needed)

```bash
nano /opt/cinelist/.env.local
# Edit variables as needed
pm2 reload cinelist
```

---

## Post-Update Verification

### Automated smoke test

```bash
./scripts/healthcheck.sh
```

### Manual checklist

| # | Check | How to verify |
|---|-------|---------------|
| 1 | App is accessible | Open `https://your-domain.com/` in browser |
| 2 | Homepage loads trending movies | Verify movie cards render with posters |
| 3 | Auth works | Click "Sign In", verify Google OAuth flow |
| 4 | Dashboard loads | Sign in → `/dashboard` shows user's lists |
| 5 | Create list works | Create a new list, add a movie |
| 6 | Search works | Search for a movie, verify results |
| 7 | AI features work | Generate AI description for a list |
| 8 | Public lists load | Visit `/explore`, verify list cards |
| 9 | Movie pages load | Click a movie, verify details page |
| 10 | No console errors | Open browser DevTools → Console |

### Check application logs

#### Vercel

- Go to Vercel dashboard → **Deployments** → click latest → **Functions** tab
- Check for runtime errors in **Logs** tab

#### Self-hosted (PM2)

```bash
# View recent logs
pm2 logs cinelist --lines 50

# View error logs only
pm2 logs cinelist --err --lines 50
```

---

## Rollback Procedure

If the update causes issues, roll back immediately.

### Rollback on Vercel

Vercel keeps all previous deployments. Rollback is instant:

1. Go to **Vercel Dashboard → Deployments**
2. Find the last working deployment
3. Click the **"..."** menu → **"Promote to Production"**

This instantly routes all traffic back to the previous deployment (zero-downtime).

#### Via CLI

```bash
# List recent deployments
npx vercel ls

# Promote a specific deployment to production
npx vercel promote <deployment-url>
```

### Rollback on VPS

```bash
ssh user@your-server
cd /opt/cinelist

# Read the previous version
PREV_VERSION=$(cat /tmp/cinelist_previous_version)
echo "Rolling back to: $PREV_VERSION"

# Checkout previous version
git checkout $PREV_VERSION

# Reinstall dependencies for that version
npm ci

# Rebuild
npm run build

# Restart
pm2 reload cinelist

# Verify
pm2 status cinelist
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

### Rollback database (if migration was applied)

#### Option 1: Neon point-in-time restore (paid plans)

1. Go to Neon dashboard → **Branches**
2. Create a new branch from a point in time **before** the migration
3. Update `DATABASE_URL` to point to the restored branch
4. Redeploy the app

#### Option 2: Restore from pg_dump backup

```bash
# Drop and recreate the database
# WARNING: This deletes all data since the backup
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
pg_restore -d "$DATABASE_URL" --no-owner --no-acls backup_YYYYMMDD_HHMMSS.dump
```

#### Option 3: Reverse migration manually

If the schema change was additive (new column/table), the old code can usually work with the new schema. No DB rollback needed.

If the change was destructive, apply the reverse manually:

```sql
-- Example: re-add a dropped column
ALTER TABLE "MovieList" ADD COLUMN "deleted_column" TEXT;
```

### Post-rollback verification

After rollback, run the same verification steps from [Post-Update Verification](#post-update-verification).

```bash
./scripts/healthcheck.sh
```

### Incident documentation

After a rollback, document:
1. What was deployed (commit hash, PR number)
2. What went wrong (error messages, affected functionality)
3. When the rollback was executed
4. What was the root cause
5. What will be done to prevent recurrence
