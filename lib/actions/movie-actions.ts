"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUser } from "@/lib/user-sync";
import { revalidatePath } from "next/cache";

// ─── Ratings ─────────────────────────────────────────────────

export async function rateMovie(tmdbId: number, rating: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await syncUser();
  if (!user) throw new Error("User sync failed");

  if (rating < 1 || rating > 10) throw new Error("Rating must be 1-10");

  await db.movieRating.upsert({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
    create: { userId: user.id, tmdbId, rating },
    update: { rating },
  });

  revalidatePath(`/movies/${tmdbId}`);
}

export async function removeRating(tmdbId: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await syncUser();
  if (!user) throw new Error("User sync failed");

  await db.movieRating.deleteMany({
    where: { userId: user.id, tmdbId },
  });

  revalidatePath(`/movies/${tmdbId}`);
}

export async function getUserRating(tmdbId: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const rating = await db.movieRating.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  });
  return rating?.rating ?? null;
}

// ─── Watchlist ───────────────────────────────────────────────

export async function toggleWatchlist(movie: {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await syncUser();
  if (!user) throw new Error("User sync failed");

  const existing = await db.watchlistItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId: movie.tmdbId } },
  });

  if (existing) {
    await db.watchlistItem.delete({ where: { id: existing.id } });
  } else {
    await db.watchlistItem.create({
      data: {
        userId: user.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        year: movie.year,
      },
    });
  }

  revalidatePath("/dashboard/watchlist");
  revalidatePath(`/movies/${movie.tmdbId}`);
  return !existing;
}

export async function isInWatchlist(tmdbId: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return false;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return false;

  const item = await db.watchlistItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  });
  return !!item;
}

// ─── Watch History ───────────────────────────────────────────

export async function markAsWatched(movie: {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string;
  runtime?: number;
  genreIds?: number[];
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await syncUser();
  if (!user) throw new Error("User sync failed");

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
  });

  // Also remove from watchlist if present
  await db.watchlistItem.deleteMany({
    where: { userId: user.id, tmdbId: movie.tmdbId },
  });

  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/watchlist");
  revalidatePath(`/movies/${movie.tmdbId}`);
}

export async function removeFromWatchHistory(tmdbId: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await syncUser();
  if (!user) throw new Error("User sync failed");

  await db.watchHistoryItem.deleteMany({
    where: { userId: user.id, tmdbId },
  });

  revalidatePath("/dashboard/history");
}

export async function isWatched(tmdbId: number) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return false;
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return false;

  const item = await db.watchHistoryItem.findUnique({
    where: { userId_tmdbId: { userId: user.id, tmdbId } },
  });
  return !!item;
}
