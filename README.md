# CineList

Web application for creating and sharing movie lists, powered by TMDB API and AI-generated personalized content.

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

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. [Neon](https://neon.tech) free tier)
- [Clerk](https://clerk.com) account
- [TMDB API](https://www.themoviedb.org/settings/api) access token
- [Google AI Studio](https://aistudio.google.com/apikey) API key

### 1. Clone and install

```bash
git clone https://github.com/andrew-dev-p/diploma.git
cd diploma
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# TMDB
TMDB_ACCESS_TOKEN=eyJ...

# Google Gemini
GEMINI_API_KEY=AI...
```

### 3. Set up database

```bash
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (main)/          — public pages (home, explore, movie details, person, list view)
  dashboard/       — authenticated pages (my lists, watchlist, history)
  api/             — API routes (TMDB proxy, AI endpoints, webhooks)
  sign-in/         — Clerk auth pages
  sign-up/
components/        — React components (UI + feature)
lib/
  actions/         — server actions (lists, movies, comments)
  ai.ts            — Gemini AI client
  db.ts            — Prisma client
  tmdb.ts          — TMDB API wrapper
  user-sync.ts     — Clerk <-> DB user sync
prisma/
  schema.prisma    — database schema
```

## Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm run dev`      | Start dev server         |
| `npm run build`    | Production build         |
| `npm run lint`     | Run ESLint               |
| `npm run format`   | Format with Prettier     |
| `npm run typecheck`| TypeScript type check    |

## License

[MIT](./LICENSE)
