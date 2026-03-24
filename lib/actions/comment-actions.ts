/**
 * @module comment-actions
 *
 * Next.js Server Actions for managing comments on public movie lists.
 *
 * Provides create, update, and delete operations for comments and replies
 * on publicly visible lists. Comments support a single level of nesting
 * via an optional `parentId` for threaded replies.
 *
 * Every exported function is a Next.js Server Action (declared via `"use server"`).
 * All actions require Clerk authentication and will throw if the user is not
 * signed in. User records are synced from Clerk to the local database via
 * {@link syncUser} before any database write.
 *
 * Ownership enforcement: users can only update or delete their own comments.
 */
"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { revalidatePath } from "next/cache"

/**
 * Adds a new comment (or reply) to a public movie list.
 *
 * The target list must be public (`isPublic: true`); commenting on private
 * lists is not allowed. The comment body is trimmed before storage.
 * Revalidates the public list page after the comment is created.
 *
 * @param listId - The unique identifier of the public list to comment on.
 * @param body - The comment text. Must not be empty after trimming.
 * @param parentId - Optional identifier of a parent comment to reply to,
 *   enabling a single level of threaded discussion.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "Comment cannot be empty" if `body` is blank after trimming.
 * @throws {Error} "List not found" if the list does not exist or is not public.
 */
export async function addComment(
  listId: string,
  body: string,
  parentId?: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  if (!body.trim()) throw new Error("Comment cannot be empty")

  const list = await db.movieList.findUnique({
    where: { id: listId, isPublic: true },
  })
  if (!list) throw new Error("List not found")

  await db.listComment.create({
    data: {
      body: body.trim(),
      userId: user.id,
      listId,
      parentId: parentId ?? null,
    },
  })

  revalidatePath(`/lists/${list.slug}`)
}

/**
 * Deletes a comment owned by the authenticated user.
 *
 * Only the comment author can delete their own comment. The Prisma `where`
 * clause includes `userId` to enforce ownership. Child replies may be
 * cascade-deleted depending on the Prisma schema configuration.
 *
 * @param commentId - The unique identifier of the comment to delete.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the comment does not exist or does not belong to the user.
 */
export async function deleteComment(commentId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.listComment.delete({
    where: { id: commentId, userId: user.id },
  })
}

/**
 * Updates the body of a comment owned by the authenticated user.
 *
 * Only the comment author can edit their own comment. The new body is
 * trimmed before storage.
 *
 * @param commentId - The unique identifier of the comment to update.
 * @param body - The new comment text (trimmed before saving).
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the comment does not exist or does not belong to the user.
 */
export async function updateComment(commentId: string, body: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.listComment.update({
    where: { id: commentId, userId: user.id },
    data: { body: body.trim() },
  })
}
