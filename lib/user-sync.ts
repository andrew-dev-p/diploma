/**
 * @module user-sync
 *
 * Synchronises the currently authenticated Clerk user to the local
 * PostgreSQL database via Prisma.
 *
 * **Architecture overview**
 *
 * Clerk manages authentication and stores canonical user profiles in its
 * own cloud.  The application, however, needs a local `User` row so that
 * other Prisma models (projects, tasks, etc.) can reference the user via
 * foreign keys.  This module bridges the two systems:
 *
 * 1. {@link syncUser} retrieves the session user with Clerk's
 *    `currentUser()` server helper.
 * 2. It then performs a Prisma `upsert` keyed on `clerkId` -- creating a
 *    new row on the first visit or updating email / username / avatar on
 *    subsequent visits.
 *
 * Call {@link syncUser} in any server-side context (Server Component,
 * Route Handler, Server Action) where you need a guaranteed local user
 * record.
 */

import { currentUser } from "@clerk/nextjs/server"

import { db } from "@/lib/db"

/**
 * Fetch the current Clerk session user and upsert a corresponding row
 * in the local `User` table.
 *
 * The function is safe to call in unauthenticated contexts -- when no
 * Clerk session exists it returns `null` without touching the database.
 *
 * When a session **does** exist the Prisma `upsert` ensures the local
 * row stays in sync with the latest Clerk profile data (email, username,
 * avatar URL).
 *
 * @returns The local Prisma `User` record if the caller is
 *          authenticated, or `null` if there is no active Clerk session.
 */
export async function syncUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
    },
  })

  return user
}
