/**
 * @module movie-actions
 *
 * Next.js Server Actions for individual movie interactions.
 *
 * Covers three feature areas:
 * - **Ratings** -- Users can rate movies on a 1-10 scale, update existing
 *   ratings, remove ratings, and retrieve their current rating.
 * - **Watchlist** -- Users can toggle movies on/off their watchlist and
 *   check whether a movie is currently on it.
 * - **Watch History** -- Users can mark movies as watched (which also
 *   removes them from the watchlist), remove entries from history, and
 *   check whether a movie has been watched.
 *
 * Every exported function is a Next.js Server Action (declared via `"use server"`).
 * Mutating actions require Clerk authentication and will throw if the user
 * is not signed in. Read-only queries (`getUserRating`, `isInWatchlist`,
 * `isWatched`) return safe defaults (`null` or `false`) for unauthenticated
 * callers instead of throwing.
 *
 * User records are synced from Clerk to the local database via {@link syncUser}
 * before any database write. Paths are revalidated with `revalidatePath` after
 * mutations so that Next.js serves fresh data on subsequent navigations.
 */
"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { revalidatePath } from "next/cache"

// ─── Ratings ─────────────────────────────────────────────────

/**
 * Rates a movie on a 1-10 scale for the authenticated user.
 *
 * Uses an upsert so that calling this function again for the same movie
 * updates the existing rating rather than creating a duplicate.
 * Revalidates the movie detail page after the operation.
 *
 * @param tmdbId - The TMDB identifier of the movie to rate.
 * @param rating - An integer rating from 1 to 10 (inclusive).
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "Rating must be 1-10" if the rating is outside the valid range.
 */
export async function rateMovie(tmdbId: number, rating: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  if (rating < 1 || rating > 10) throw new Error("Rating must be 1-10")

  await db.movieRating.upsert({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
    create: { userId: user.id, tmdbId, rating },
    update: { rating },
  })

  revalidatePath(`/movies/${tmdbId}`)
}

/**
 * Removes the authenticated user's rating for a movie.
 *
 * Deletes all rating records matching the user and TMDB ID (at most one
 * should exist due to the unique constraint). Revalidates the movie detail page.
 *
 * @param tmdbId - The TMDB identifier of the movie whose rating should be removed.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function removeRating(tmdbId: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.movieRating.deleteMany({
    where: { userId: user.id, tmdbId },
  })

  revalidatePath(`/movies/${tmdbId}`)
}

/**
 * Retrieves the authenticated user's rating for a specific movie.
 *
 * This is a read-only query that does **not** require `syncUser`.
 * Returns `null` gracefully if the user is not signed in, has no local
 * database record, or has not rated the movie.
 *
 * @param tmdbId - The TMDB identifier of the movie to look up.
 * @returns The user's numeric rating (1-10), or `null` if not rated or not authenticated.
 */
export async function getUserRating(tmdbId: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const rating = await db.movieRating.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  })
  return rating?.rating ?? null
}

// ─── Watchlist ───────────────────────────────────────────────

/**
 * Toggles a movie on or off the authenticated user's watchlist.
 *
 * If the movie is already on the watchlist it is removed; otherwise it is added.
 * Revalidates the watchlist dashboard page and the movie detail page.
 *
 * @param movie - The movie data to toggle.
 *   - `tmdbId` (number) -- The TMDB identifier for the movie.
 *   - `title` (string) -- The movie title.
 *   - `posterPath` (string | null) -- Relative path to the TMDB poster image, or `null`.
 *   - `year` (string) -- The release year of the movie.
 * @returns `true` if the movie was added to the watchlist, `false` if it was removed.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function toggleWatchlist(movie: {
  tmdbId: number
  title: string
  posterPath: string | null
  year: string
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const existing = await db.watchlistItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId: movie.tmdbId } },
  })

  if (existing) {
    await db.watchlistItem.delete({ where: { id: existing.id } })
  } else {
    await db.watchlistItem.create({
      data: {
        userId: user.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        year: movie.year,
      },
    })
  }

  revalidatePath("/dashboard/watchlist")
  revalidatePath(`/movies/${movie.tmdbId}`)
  return !existing
}

/**
 * Checks whether a movie is on the authenticated user's watchlist.
 *
 * This is a read-only query that does **not** require `syncUser`.
 * Returns `false` gracefully if the user is not signed in or has no
 * local database record.
 *
 * @param tmdbId - The TMDB identifier of the movie to check.
 * @returns `true` if the movie is on the watchlist, `false` otherwise.
 */
export async function isInWatchlist(tmdbId: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return false
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return false

  const item = await db.watchlistItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  })
  return !!item
}

// ─── Watch History ───────────────────────────────────────────

/**
 * Records a movie as watched for the authenticated user.
 *
 * Uses an upsert: if the movie was already marked as watched, its `watchedAt`
 * timestamp is refreshed to the current date/time. As a side effect, the movie
 * is also removed from the user's watchlist (if present), since they have now
 * watched it. Revalidates the history page, watchlist page, and movie detail page.
 *
 * @param movie - The movie data to record.
 *   - `tmdbId` (number) -- The TMDB identifier for the movie.
 *   - `title` (string) -- The movie title.
 *   - `posterPath` (string | null) -- Relative path to the TMDB poster image, or `null`.
 *   - `year` (string) -- The release year of the movie.
 *   - `runtime` (number, optional) -- Runtime in minutes; stored as `null` if omitted.
 *   - `genreIds` (number[], optional) -- Array of TMDB genre IDs, stored as a comma-separated string.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function markAsWatched(movie: {
  tmdbId: number
  title: string
  posterPath: string | null
  year: string
  runtime?: number
  genreIds?: number[]
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.watchHistoryItem.upsert({
    where: { userId_tmdbId: { userId: user.id, tmdbId: movie.tmdbId } },
    create: {
      userId: user.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterPath: movie.posterPath,
      year: movie.year,
      runtime: movie.runtime ?? null,
      genreIds: movie.genreIds?.join(",") ?? null,
    },
    update: { watchedAt: new Date() },
  })

  // Also remove from watchlist if present
  await db.watchlistItem.deleteMany({
    where: { userId: user.id, tmdbId: movie.tmdbId },
  })

  revalidatePath("/dashboard/history")
  revalidatePath("/dashboard/watchlist")
  revalidatePath(`/movies/${movie.tmdbId}`)
}

/**
 * Removes a movie from the authenticated user's watch history.
 *
 * Deletes all history records matching the user and TMDB ID (at most one
 * should exist due to the unique constraint). Revalidates the history page.
 *
 * @param tmdbId - The TMDB identifier of the movie to remove from history.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function removeFromWatchHistory(tmdbId: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.watchHistoryItem.deleteMany({
    where: { userId: user.id, tmdbId },
  })

  revalidatePath("/dashboard/history")
}

/**
 * Checks whether a movie has been watched by the authenticated user.
 *
 * This is a read-only query that does **not** require `syncUser`.
 * Returns `false` gracefully if the user is not signed in or has no
 * local database record.
 *
 * @param tmdbId - The TMDB identifier of the movie to check.
 * @returns `true` if the movie is in the user's watch history, `false` otherwise.
 */
export async function isWatched(tmdbId: number) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return false
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return false

  const item = await db.watchHistoryItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  })
  return !!item
}
