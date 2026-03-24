# CineList

Web application for creating and sharing movie lists, powered by TMDB API and AI-generated personalized content.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│                   (Browser / Mobile)                    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│                    Vercel Edge Network                  │
│               (CDN + Edge Middleware)                   │
│            Clerk auth middleware (JWT check)            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              Next.js 16 Application Server              │
│                    (Node.js runtime)                    │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ App Router  │  │ API Routes   │  │ Server Actions│  │
│  │ (SSR/RSC)   │  │ /api/*       │  │ (mutations)   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                  │           │
│  ┌──────▼────────────────▼──────────────────▼───────┐  │
│  │              Prisma 7 ORM (pg adapter)           │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼────┐ ┌───────▼──────┐ ┌──────▼───────┐
│  PostgreSQL  │ │   TMDB API   │ │ Google Gemini│
│   (Neon)     │ │  (REST API)  │ │  (GenAI SDK) │
│  Database    │ │  Movie data  │ │  AI content  │
└──────────────┘ └──────────────┘ └──────────────┘
                          │
                 ┌────────▼────────┐
                 │   Clerk (Auth)  │
                 │  Google OAuth   │
                 │  User management│
                 └─────────────────┘
```

### Components

| Component | Role | Technology |
|-----------|------|------------|
| **Web/Application Server** | SSR, API routes, server actions | Next.js 16 on Vercel (Node.js) |
| **Database** | User data, lists, ratings, comments, watch history | PostgreSQL (Neon serverless) |
| **Auth Provider** | Authentication, session management, user profiles | Clerk (Google OAuth) |
| **Movie Data API** | Film metadata, cast, crew, images, trailers | TMDB REST API |
| **AI Service** | List descriptions, movie recommendations, trending analysis | Google Gemini (via @google/genai) |
| **CDN / Edge** | Static assets, image optimization, middleware | Vercel Edge Network |

> **Note:** The project does not use a separate file storage, caching service, or message queue. Static assets are served via Vercel's CDN, and Next.js built-in `fetch` cache handles API response caching.

## Features

- **Movie Discovery** — browse trending, search by title, and filter by genre/year/rating via TMDB
- **Rich Movie Pages** — detailed info including cast, crew, budget, revenue, trailers, and similar movies
- **Actor & Director Pages** — filmography, biography, and known-for highlights
- **Custom Movie Lists** — create, edit, reorder (drag & drop), tag, and share public lists
- **List Templates** — quick-start with "Top 10 of Year", "Director Spotlight", "Genre Deep Dive", etc.
- **List Forking** — copy any public list to your account and make it your own
- **Comments** — threaded discussions on public lists
- **Watchlist** — one-click "Watch Later" from any movie card
- **Watch History & Stats** — track watched movies with total runtime, genre breakdown, and timeline
- **Personal Ratings** — rate movies 1-10, visible across the app
- **AI Features** — trending banner, auto-generated list descriptions, and context-aware movie suggestions
- **Auth** — Google OAuth via Clerk

## Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)           |
| Language   | TypeScript                                   |
| Styling    | Tailwind CSS 4, shadcn/ui, Radix UI          |
| Auth       | Clerk (Google OAuth)                         |
| Database   | PostgreSQL (Neon) + Prisma 7                 |
| Movie Data | TMDB API                                     |
| AI         | Google Gemini (via @google/genai)            |
| Deployment | Vercel (recommended)                         |

## Developer Onboarding Guide

This guide assumes a **fresh operating system** with no pre-installed development tools.

### Step 1: Install required software

#### macOS

```bash
# Install Homebrew (package manager)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20+ (via nvm - recommended)
brew install nvm
mkdir ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 22
nvm use 22

# Install Git (if not already present)
brew install git
```

#### Ubuntu / Debian

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git curl

# Install Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

#### Windows

```powershell
# Install nvm-windows from https://github.com/coreybutler/nvm-windows/releases
# Then in a new terminal:
nvm install 22
nvm use 22

# Install Git from https://git-scm.com/download/win
```

#### Verify installations

```bash
node --version    # Should be v20+ (recommended v22)
npm --version     # Should be v10+
git --version     # Should be v2+
```

### Step 2: Clone the repository

```bash
git clone https://github.com/andrew-dev-p/diploma.git
cd diploma
```

### Step 3: Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` including Next.js, React, Prisma, Clerk, etc.

### Step 4: Set up external services

You need accounts on 4 services (all have free tiers):

#### 4.1 PostgreSQL Database — [Neon](https://neon.tech)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project (any name, choose closest region)
3. Copy the connection string from the dashboard — it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

#### 4.2 Authentication — [Clerk](https://clerk.com)

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to **Configure → Social Connections** → enable **Google**
4. Copy keys from **API Keys** page:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

#### 4.3 Movie Data — [TMDB](https://www.themoviedb.org)

1. Create account at [themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API** → request an API key
3. Copy the **API Read Access Token** (long Bearer token, NOT the short API key)

#### 4.4 AI — [Google AI Studio](https://aistudio.google.com)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key (starts with `AI`)

### Step 5: Configure environment variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

Or create it manually with all required variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# TMDB API
TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...

# Google Gemini AI
GEMINI_API_KEY=AI...
```

### Step 6: Set up the database

Push the Prisma schema to create all tables:

```bash
npx prisma db push
```

To explore the database visually:

```bash
npx prisma studio
```

### Step 7: Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app should load with the homepage showing trending movies.

### Step 8: Verify everything works

- [ ] Homepage loads and shows trending movies from TMDB
- [ ] Sign in with Google works (redirects to `/dashboard`)
- [ ] Creating a new list works
- [ ] Searching and adding movies to a list works
- [ ] AI description generation works (click "AI Description" on a list)

## Project Structure

```
app/
  (main)/            — public pages (home, explore, movie details, person, list view)
  dashboard/         — authenticated pages (my lists, watchlist, history)
  api/               — API routes (TMDB proxy, AI endpoints, webhooks)
  thesis/            — bachelor thesis landing page
  sign-in/           — Clerk auth pages
  sign-up/
components/          — React components (UI + feature)
  ui/                — shadcn/ui base components
docs/                — deployment and operations documentation
lib/
  actions/           — server actions (lists, movies, comments)
  ai.ts              — Gemini AI client
  db.ts              — Prisma client singleton
  tmdb.ts            — TMDB API wrapper
  user-sync.ts       — Clerk ↔ DB user sync
prisma/
  schema.prisma      — database schema (12 models)
scripts/             — automation scripts (dev, prod, backup)
public/              — static assets (university logo)
middleware.ts        — Clerk auth middleware (protects /dashboard)
```

## Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start dev server (Turbopack)       |
| `npm run build`    | Production build                   |
| `npm run start`    | Start production server            |
| `npm run lint`     | Run ESLint                         |
| `npm run format`   | Format with Prettier               |
| `npm run typecheck`| TypeScript type check              |

### Prisma commands

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `npx prisma db push`      | Sync schema to database (dev)        |
| `npx prisma migrate dev`  | Create a migration (production-ready)|
| `npx prisma generate`     | Regenerate Prisma Client types       |
| `npx prisma studio`       | Open database GUI in browser         |

## Documentation

- [Production Deployment Guide](./docs/deployment.md)
- [Update & Rollback Procedures](./docs/update-rollback.md)
- [Linting & Static Analysis](./docs/linting.md)
- [Documentation Generation](./docs/generate_docs.md)
- [API Reference (generated)](./docs-generated/) — run `npm run docs` to generate

### Code Documentation Standards

All contributors must follow these documentation practices:

**Every exported function** must have a TSDoc comment with:
- Description of what the function does
- `@param` for each parameter
- `@returns` for the return value
- `@throws` for error conditions
- `@example` for non-trivial functions

```ts
/**
 * Adds a movie to the user's watchlist, or removes it if already present.
 * @param movie - Movie data including TMDB ID, title, poster, and year
 * @returns `true` if added, `false` if removed
 * @throws Error if user is not authenticated
 * @example
 * ```ts
 * const added = await toggleWatchlist({ tmdbId: 550, title: "Fight Club", posterPath: "/poster.jpg", year: "1999" })
 * ```
 */
```

**Every module** (`lib/*.ts`) must have a module-level docblock:

```ts
/**
 * @module tmdb
 * @description TMDB API v3 wrapper with typed responses and built-in caching.
 */
```

**Interfaces and types** must have per-property documentation for non-obvious fields.

**Run `npm run docs:check`** before committing to verify documentation coverage.

## License

[MIT](./LICENSE)
