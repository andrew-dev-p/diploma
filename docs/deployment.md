# Production Deployment Guide

This document provides step-by-step instructions for deploying CineList to a production environment.

## Table of Contents

- [Hardware Requirements](#hardware-requirements)
- [Required Software](#required-software)
- [Network Configuration](#network-configuration)
- [Database Setup](#database-setup)
- [Authentication Setup](#authentication-setup)
- [External API Keys](#external-api-keys)
- [Option A: Deploy to Vercel (Recommended)](#option-a-deploy-to-vercel-recommended)
- [Option B: Deploy to VPS / Self-Hosted](#option-b-deploy-to-vps--self-hosted)
- [Health Check & Verification](#health-check--verification)

---

## Hardware Requirements

### Vercel (Recommended — Serverless)

No hardware provisioning needed. Vercel handles auto-scaling.

| Resource | Provided by Vercel Free/Pro |
|----------|-----------------------------|
| CPU | Serverless functions (up to 10s execution) |
| RAM | 1024 MB per function |
| Storage | Static assets via CDN |
| Bandwidth | 100 GB/month (free), 1 TB (pro) |

### Self-Hosted (VPS)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| Architecture | x86_64 or ARM64 | x86_64 |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB SSD | 20 GB SSD |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |

---

## Required Software

### For Vercel deployment

- Git
- GitHub account (repo connected to Vercel)
- Vercel account (free tier sufficient)

### For self-hosted deployment

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 22.x LTS | Application runtime |
| npm | 10.x+ | Package management |
| Git | 2.x+ | Source code management |
| Nginx | 1.24+ | Reverse proxy (optional) |
| PM2 | 5.x+ | Process manager |
| certbot | latest | SSL certificates (Let's Encrypt) |

Install on Ubuntu:

```bash
# Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22

# Nginx + Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# PM2 (process manager)
npm install -g pm2
```

---

## Network Configuration

### Required outbound connections

The application server must be able to reach these external services:

| Service | Hostname | Port | Protocol |
|---------|----------|------|----------|
| Neon PostgreSQL | `*.neon.tech` | 5432 | TCP/TLS |
| TMDB API | `api.themoviedb.org` | 443 | HTTPS |
| TMDB Images | `image.tmdb.org` | 443 | HTTPS |
| Google Gemini | `generativelanguage.googleapis.com` | 443 | HTTPS |
| Clerk Auth | `*.clerk.accounts.dev`, `api.clerk.com` | 443 | HTTPS |
| Clerk Images | `img.clerk.com` | 443 | HTTPS |

### Required inbound ports (self-hosted)

| Port | Purpose |
|------|---------|
| 80 | HTTP (redirect to HTTPS) |
| 443 | HTTPS (main application) |
| 22 | SSH (administration) |

### Firewall setup (self-hosted)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Database Setup

CineList uses **Neon** (serverless PostgreSQL). No self-hosted database is required.

### Create Neon database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project:
   - **Name**: `cinelist-production`
   - **Region**: Choose closest to your deployment (e.g., `eu-central-1` for Europe)
   - **PostgreSQL version**: 17 (latest)
3. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/cinelist?sslmode=require
   ```

### Neon production settings

- Enable **connection pooling** for better performance
- Set **autoscaling** compute size: 0.25–2 CU (free tier) or higher (paid)
- Enable **point-in-time restore** (paid plans — for backups)

### Initialize schema

Run from your local machine (or CI/CD):

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

Or with migrations (recommended for production):

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## Authentication Setup

### Clerk production instance

1. In [Clerk Dashboard](https://dashboard.clerk.com), switch to **Production** mode
2. Add your production domain under **Domains**
3. Configure **Social Connections → Google** with production OAuth credentials:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Set authorized redirect URI to: `https://your-domain.com/sso-callback`
4. Copy production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_`)

### Webhook (optional)

To sync user data on creation/update:

1. In Clerk → **Webhooks**, add endpoint: `https://your-domain.com/api/webhooks/clerk`
2. Select events: `user.created`, `user.updated`, `user.deleted`
3. Copy the signing secret: `CLERK_WEBHOOK_SECRET`

---

## External API Keys

| Variable | Source | How to get |
|----------|--------|------------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) | Project dashboard → Connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) | API Keys page |
| `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) | API Keys page |
| `TMDB_ACCESS_TOKEN` | [themoviedb.org](https://www.themoviedb.org/settings/api) | Settings → API → Read Access Token |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) | Create API key |

---

## Option A: Deploy to Vercel (Recommended)

### 1. Connect repository

1. Sign up at [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import `andrew-dev-p/diploma` from GitHub
4. Framework preset: **Next.js** (auto-detected)

### 2. Set environment variables

In **Settings → Environment Variables**, add all variables from the table above.

Set each variable for the **Production** environment:

```
DATABASE_URL = postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
CLERK_SECRET_KEY = sk_live_...
TMDB_ACCESS_TOKEN = eyJ...
GEMINI_API_KEY = AI...
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

### 3. Deploy

Click **Deploy**. Vercel will:
1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate` — via postinstall)
3. Build the app (`next build`)
4. Deploy to edge network

### 4. Custom domain (optional)

1. In **Settings → Domains**, add your domain
2. Update DNS records as instructed
3. SSL certificate is provisioned automatically

---

## Option B: Deploy to VPS / Self-Hosted

### 1. Clone and build

```bash
# Clone repository
git clone https://github.com/andrew-dev-p/diploma.git /opt/cinelist
cd /opt/cinelist

# Install production dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build for production
npm run build
```

### 2. Environment variables

```bash
# Create environment file
sudo nano /opt/cinelist/.env.local
# Add all variables (see External API Keys section)
```

### 3. Run with PM2

```bash
# Start with PM2
pm2 start npm --name "cinelist" -- start

# Save PM2 config for auto-restart on reboot
pm2 save
pm2 startup
```

### 4. Nginx reverse proxy

```nginx
# /etc/nginx/sites-available/cinelist
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/cinelist /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Health Check & Verification

After deployment, verify these endpoints:

| Check | URL | Expected |
|-------|-----|----------|
| Homepage loads | `https://your-domain.com/` | 200 OK, trending movies visible |
| API works | `https://your-domain.com/api/movies/trending` | 200 OK, JSON response with movies |
| Auth works | `https://your-domain.com/sign-in` | Clerk sign-in page renders |
| DB connected | `https://your-domain.com/explore` | Public lists load (or empty state) |
| AI works | Create a list → click "AI Description" | Description generates successfully |
| Images load | Any movie page | TMDB poster/backdrop images render |
| Thesis page | `https://your-domain.com/thesis` | Landing page renders |

### Quick smoke test script

```bash
#!/bin/bash
DOMAIN="https://your-domain.com"

echo "Testing CineList deployment..."

# Homepage
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/")
echo "Homepage: $STATUS (expected 200)"

# API
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/movies/trending")
echo "API: $STATUS (expected 200)"

# Auth
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sign-in")
echo "Auth: $STATUS (expected 200)"

# Thesis
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/thesis")
echo "Thesis: $STATUS (expected 200)"
```
