# Architecture & Design Decisions

## System Overview

CineList is a full-stack web application built with Next.js 16 using the App Router architecture. It follows a serverless-first approach, designed for deployment on Vercel.

```
Browser ──► Vercel Edge (Clerk middleware) ──► Next.js App
                                                  │
                           ┌──────────────────────┼──────────────────────┐
                           │                      │                      │
                     Server Components      API Routes           Server Actions
                     (SSR, data fetch)    (REST endpoints)      (mutations)
                           │                      │                      │
                           └──────────────────────┼──────────────────────┘
                                                  │
                                           Prisma ORM (pg adapter)
                                                  │
                              ┌───────────────────┼───────────────────┐
                              │                   │                   │
                        Neon PostgreSQL       TMDB REST API     Google Gemini
                        (user data)          (movie data)       (AI content)
```

## Key Architectural Decisions

### 1. Next.js App Router with Server Components

**Decision:** Use React Server Components (RSC) as the default rendering strategy.

**Rationale:**
- Movie detail pages fetch from TMDB API on the server — no client-side loading spinners
- User-specific data (ratings, watchlist status) fetched in parallel with movie data
- Only interactive elements (forms, drag-and-drop, search) are Client Components (`"use client"`)
- Reduces JavaScript sent to the browser by ~40% compared to a fully client-rendered SPA

**Trade-off:** More complex mental model for developers (server vs. client boundaries).

### 2. Server Actions for Mutations

**Decision:** Use Next.js Server Actions (`"use server"`) instead of API routes for all data mutations.

**Rationale:**
- Type-safe from client to server (no manual request/response serialization)
- Automatic revalidation via `revalidatePath()` after mutations
- Progressive enhancement — forms work without JavaScript
- Simpler than maintaining separate API routes for every mutation

**Where used:** All `lib/actions/*.ts` files — list CRUD, ratings, watchlist, comments.

### 3. Clerk for Authentication

**Decision:** Use Clerk (hosted auth) instead of NextAuth or custom auth.

**Rationale:**
- Zero-config Google OAuth with pre-built UI components
- Middleware-level protection via `clerkMiddleware()` — no auth checks in every route
- User webhook syncs Clerk profiles to local DB (for foreign key relationships)
- Handles session management, JWT rotation, and security automatically

**Architecture note:** The `syncUser()` function in `lib/user-sync.ts` is called at the start of every Server Action to ensure the local DB user exists.

### 4. Neon Serverless PostgreSQL

**Decision:** Use Neon (serverless Postgres) via `@prisma/adapter-pg` instead of a traditional managed database.

**Rationale:**
- Scales to zero on idle (cost-effective for a student project)
- No connection pool management needed — Neon handles it
- Compatible with Prisma via the `@prisma/adapter-pg` driver adapter
- Supports branching for schema experimentation

### 5. TMDB API as Primary Data Source

**Decision:** Do not store movie metadata locally — always fetch from TMDB.

**Rationale:**
- TMDB has 900,000+ movies with constantly updated ratings, images, and credits
- Caching via Next.js `fetch` with `revalidate: 3600` (1 hour) reduces API calls
- Local DB only stores user-generated data (lists, ratings, comments)
- Simplifies data consistency — no sync between local movie DB and TMDB

**Trade-off:** Dependent on TMDB availability. Mitigated by ISR caching.

### 6. Google Gemini for AI Features

**Decision:** Use Google Gemini 2.0 Flash for all AI-generated content.

**Rationale:**
- Fast inference (< 2s for most requests)
- Free tier sufficient for the project scope
- Structured JSON output via prompt engineering (no function calling needed)
- All AI responses are parsed with try/catch — failures return empty/null, never crash

**AI interaction pattern:**
1. Construct a prompt with movie context
2. Call Gemini with `generateContent()`
3. Parse the text response as JSON
4. Return typed result or fallback (empty array / null)

## Component Interaction Patterns

### Data Flow: Movie List Page

```
1. User visits /lists/[slug]
2. Server Component fetches list from DB (Prisma)
3. For each movie in list, TMDB data is NOT re-fetched
   (title, poster stored in ListItem at add time)
4. Like count, comment count computed from DB relations
5. Interactive elements (LikeButton, ForkButton, Comments)
   are Client Components with Server Action handlers
```

### Data Flow: AI Description Generation

```
1. User clicks "AI Description" button (Client Component)
2. Client POSTs to /api/ai/generate-description
3. API route calls generateListDescription() from lib/ai.ts
4. Gemini returns free-text description
5. Client calls updateList() Server Action to save to DB
6. revalidatePath() refreshes the page with new description
```

### Data Flow: Movie Search & Add to List

```
1. User types in MovieSearch (Client Component, debounced)
2. Client GETs /api/movies/search?q=...
3. API route proxies to TMDB search/movie
4. Results displayed in Command palette (cmdk)
5. User clicks a result
6. Client calls addMovieToList() Server Action
7. Server Action saves ListItem to DB with movie metadata
8. revalidatePath() refreshes the list editor
```

## Database Schema Design

The Prisma schema (`prisma/schema.prisma`) follows these principles:

- **User is the root entity** — all user-generated content references User via foreign key
- **Cascade deletes** — deleting a user removes all their lists, ratings, comments, etc.
- **Composite unique constraints** — prevent duplicates (e.g., one rating per user per movie)
- **Indexes on query patterns** — `[userId]`, `[isPublic, updatedAt]`, `[tmdbId]`
- **TMDB ID as reference** — movies are not stored as entities; only `tmdbId` (integer) links to TMDB

## Security Model

1. **Middleware layer:** Clerk middleware intercepts all requests, validates JWT
2. **Route protection:** `/dashboard(.*)` requires authentication (returns 401 otherwise)
3. **Server Action authorization:** Every action calls `auth()` and verifies the user owns the resource
4. **Public access:** Movie pages, explore page, public lists — no auth required
5. **Webhook verification:** Clerk webhooks verified via Svix signature
