/**
 * @module list-actions
 *
 * Next.js Server Actions for movie list management.
 *
 * Provides CRUD operations for movie lists, list item manipulation
 * (add, remove, reorder), social features (likes, forking), tag management,
 * template-based list creation, and per-item notes.
 *
 * Every exported function is a Next.js Server Action (declared via `"use server"`).
 * All mutating actions require Clerk authentication and will throw if the user
 * is not signed in. User records are synced from Clerk to the local database
 * via {@link syncUser} before any database write.
 *
 * Paths are revalidated with `revalidatePath` after mutations so that
 * Next.js serves fresh data on subsequent navigations.
 */
"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { revalidatePath } from "next/cache"
import slugify from "slugify"
import { nanoid } from "nanoid"

/**
 * Creates a new movie list for the authenticated user.
 *
 * Generates a URL-safe slug from the list name, appending a random 6-character
 * nanoid suffix to ensure uniqueness. Revalidates the dashboard page after creation.
 *
 * @param formData - Form data containing the list fields.
 *   - `name` (string, required) -- The display name of the list.
 *   - `description` (string, optional) -- A short description of the list.
 * @returns An object with the newly created list's `id` and `slug`.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function createList(formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const baseSlug = slugify(name, { lower: true, strict: true })
  const slug = `${baseSlug}-${nanoid(6)}`

  const list = await db.movieList.create({
    data: {
      name,
      description,
      slug,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard")
  return { id: list.id, slug: list.slug }
}

/**
 * Updates an existing movie list owned by the authenticated user.
 *
 * Only the fields provided in `data` are updated; omitted fields remain unchanged.
 * Revalidates both the dashboard and the public list page after the update.
 *
 * @param listId - The unique identifier of the list to update.
 * @param data - A partial object of list fields to update.
 *   - `name` (string, optional) -- New display name.
 *   - `description` (string | null, optional) -- New description, or `null` to clear.
 *   - `isPublic` (boolean, optional) -- Whether the list is publicly visible.
 *   - `aiDescription` (string | null, optional) -- AI-generated description, or `null` to clear.
 * @returns The full updated `MovieList` record from the database.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the list does not exist or does not belong to the user.
 */
export async function updateList(
  listId: string,
  data: {
    name?: string
    description?: string | null
    isPublic?: boolean
    aiDescription?: string | null
  }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const list = await db.movieList.update({
    where: { id: listId, userId: user.id },
    data,
  })

  revalidatePath("/dashboard")
  revalidatePath(`/lists/${list.slug}`)
  return list
}

/**
 * Permanently deletes a movie list owned by the authenticated user.
 *
 * All associated list items, tags, likes, and comments are cascade-deleted
 * per the Prisma schema. Revalidates the dashboard after deletion.
 *
 * @param listId - The unique identifier of the list to delete.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the list does not exist or does not belong to the user.
 */
export async function deleteList(listId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.movieList.delete({
    where: { id: listId, userId: user.id },
  })

  revalidatePath("/dashboard")
}

/**
 * Adds a movie to an existing list owned by the authenticated user.
 *
 * The movie is appended at the end of the list by calculating the next
 * `order` value from the current highest-ordered item. Revalidates both
 * the dashboard list editor page and the public list page.
 *
 * @param listId - The unique identifier of the target list.
 * @param movie - The movie data to add.
 *   - `tmdbId` (number) -- The TMDB identifier for the movie.
 *   - `title` (string) -- The movie title.
 *   - `posterPath` (string | null) -- Relative path to the TMDB poster image, or `null`.
 *   - `year` (string) -- The release year of the movie.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "List not found" if the list does not exist or does not belong to the user.
 */
export async function addMovieToList(
  listId: string,
  movie: {
    tmdbId: number
    title: string
    posterPath: string | null
    year: string
  }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const list = await db.movieList.findUnique({
    where: { id: listId, userId: user.id },
    include: { items: { orderBy: { order: "desc" }, take: 1 } },
  })
  if (!list) throw new Error("List not found")

  const nextOrder = (list.items[0]?.order ?? -1) + 1

  await db.listItem.create({
    data: {
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterPath: movie.posterPath,
      year: movie.year,
      order: nextOrder,
      listId,
    },
  })

  revalidatePath(`/dashboard/lists/${listId}`)
  revalidatePath(`/lists/${list.slug}`)
}

/**
 * Removes a single movie item from a list owned by the authenticated user.
 *
 * Ownership is verified by ensuring the parent list belongs to the current user.
 * Revalidates the dashboard list editor page after removal.
 *
 * @param listId - The unique identifier of the parent list.
 * @param itemId - The unique identifier of the list item to remove.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the item/list does not exist or the user lacks ownership.
 */
export async function removeMovieFromList(listId: string, itemId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.listItem.delete({
    where: {
      id: itemId,
      list: { id: listId, userId: user.id },
    },
  })

  revalidatePath(`/dashboard/lists/${listId}`)
}

/**
 * Reorders the items in a list owned by the authenticated user.
 *
 * Accepts an array of list-item IDs in the desired order. Each ID is assigned
 * an ascending `order` value (0, 1, 2, ...) within a database transaction.
 * IDs that do not exist in the database are silently filtered out.
 * If no valid IDs remain after filtering, the function returns immediately.
 *
 * @param listId - The unique identifier of the list whose items are being reordered.
 * @param orderedItemIds - An array of list-item IDs in the new desired display order.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "List not found" if the list does not exist or does not belong to the user.
 */
export async function reorderListItems(
  listId: string,
  orderedItemIds: string[]
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const list = await db.movieList.findUnique({
    where: { id: listId, userId: user.id },
    include: { items: { select: { id: true } } },
  })
  if (!list) throw new Error("List not found")

  // Filter to only IDs that actually exist in the database
  const existingIds = new Set(list.items.map((i) => i.id))
  const validIds = orderedItemIds.filter((id) => existingIds.has(id))

  if (validIds.length === 0) return

  await db.$transaction(
    validIds.map((id, index) =>
      db.listItem.update({
        where: { id },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/dashboard/lists/${listId}`)
}

/**
 * Toggles a like on a movie list for the authenticated user.
 *
 * If the user has already liked the list, the like is removed.
 * If the user has not yet liked it, a new like is created.
 * Revalidates the explore page so that like counts stay current.
 *
 * @param listId - The unique identifier of the list to like/unlike.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function toggleLike(listId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const existing = await db.listLike.findUnique({
    where: { userId_listId: { userId: user.id, listId } },
  })

  if (existing) {
    await db.listLike.delete({ where: { id: existing.id } })
  } else {
    await db.listLike.create({
      data: { userId: user.id, listId },
    })
  }

  revalidatePath("/explore")
}

// ─── Forking ─────────────────────────────────────────────────

/**
 * Forks (clones) a public movie list into the authenticated user's account.
 *
 * Creates a deep copy of the original list including all items (preserving order)
 * and tags. The new list receives a fresh slug and stores a `forkedFromId`
 * reference back to the original. Only publicly visible lists can be forked.
 * Revalidates the dashboard after creation.
 *
 * @param listId - The unique identifier of the public list to fork.
 * @returns An object with the forked list's `id` and `slug`.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "List not found" if the list does not exist or is not public.
 */
export async function forkList(listId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const original = await db.movieList.findUnique({
    where: { id: listId, isPublic: true },
    include: { items: { orderBy: { order: "asc" } }, tags: true },
  })
  if (!original) throw new Error("List not found")

  const baseSlug = slugify(original.name, { lower: true, strict: true })
  const slug = `${baseSlug}-${nanoid(6)}`

  const forked = await db.movieList.create({
    data: {
      name: original.name,
      description: original.description,
      slug,
      userId: user.id,
      forkedFromId: original.id,
      items: {
        create: original.items.map((item) => ({
          tmdbId: item.tmdbId,
          title: item.title,
          posterPath: item.posterPath,
          year: item.year,
          order: item.order,
        })),
      },
      tags: {
        create: original.tags.map((tag) => ({ name: tag.name })),
      },
    },
  })

  revalidatePath("/dashboard")
  return { id: forked.id, slug: forked.slug }
}

// ─── Tags ────────────────────────────────────────────────────

/**
 * Replaces all tags on a list owned by the authenticated user.
 *
 * Performs a delete-all-then-recreate strategy: all existing tags on the list
 * are removed, then the new set is inserted. Tags are trimmed, lowercased,
 * and capped at a maximum of 10. Empty strings are filtered out.
 * Revalidates the dashboard list editor, the public list page, and the explore page.
 *
 * @param listId - The unique identifier of the list to tag.
 * @param tags - An array of tag name strings to set on the list.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} "List not found" if the list does not exist or does not belong to the user.
 */
export async function updateListTags(listId: string, tags: string[]) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const list = await db.movieList.findUnique({
    where: { id: listId, userId: user.id },
  })
  if (!list) throw new Error("List not found")

  // Remove all existing tags and re-create
  await db.listTag.deleteMany({ where: { listId } })

  if (tags.length > 0) {
    await db.listTag.createMany({
      data: tags
        .filter((t) => t.trim())
        .slice(0, 10) // max 10 tags
        .map((name) => ({
          name: name.trim().toLowerCase(),
          listId,
        })),
    })
  }

  revalidatePath(`/dashboard/lists/${listId}`)
  revalidatePath(`/lists/${list.slug}`)
  revalidatePath("/explore")
}

// ─── Templates ───────────────────────────────────────────────

/**
 * Creates a new movie list from a predefined template.
 *
 * Templates provide a set of initial tags associated with common list archetypes.
 * Supported template names and their tags:
 * - `"top-10"` -- `["ranked", "favorites"]`
 * - `"director-spotlight"` -- `["director", "auteur"]`
 * - `"genre-deep-dive"` -- `["genre", "curated"]`
 * - `"movie-marathon"` -- `["marathon", "binge"]`
 *
 * If the `templateName` is not recognized, the list is created with no tags.
 * Revalidates the dashboard after creation.
 *
 * @param templateName - The identifier of the template to use (e.g., `"top-10"`).
 * @param listName - The display name for the new list.
 * @returns An object with the newly created list's `id` and `slug`.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 */
export async function createListFromTemplate(
  templateName: string,
  listName: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  const baseSlug = slugify(listName, { lower: true, strict: true })
  const slug = `${baseSlug}-${nanoid(6)}`

  const templateTags: Record<string, string[]> = {
    "top-10": ["ranked", "favorites"],
    "director-spotlight": ["director", "auteur"],
    "genre-deep-dive": ["genre", "curated"],
    "movie-marathon": ["marathon", "binge"],
  }

  const list = await db.movieList.create({
    data: {
      name: listName,
      slug,
      userId: user.id,
      tags: {
        create: (templateTags[templateName] ?? []).map((name) => ({ name })),
      },
    },
  })

  revalidatePath("/dashboard")
  return { id: list.id, slug: list.slug }
}

// ─── Update item notes ──────────────────────────────────────

/**
 * Updates the personal notes on a specific item within a list.
 *
 * Allows the list owner to attach or clear a free-text note on any item
 * in their list. Revalidates the dashboard list editor page.
 *
 * @param listId - The unique identifier of the parent list.
 * @param itemId - The unique identifier of the list item to annotate.
 * @param notes - The note text to set, or `null` to clear existing notes.
 * @throws {Error} "Unauthorized" if the user is not authenticated.
 * @throws {Error} "User sync failed" if the Clerk-to-DB user sync fails.
 * @throws {Error} Prisma error if the item/list does not exist or the user lacks ownership.
 */
export async function updateItemNotes(
  listId: string,
  itemId: string,
  notes: string | null
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.listItem.update({
    where: {
      id: itemId,
      list: { id: listId, userId: user.id },
    },
    data: { notes },
  })

  revalidatePath(`/dashboard/lists/${listId}`)
}
