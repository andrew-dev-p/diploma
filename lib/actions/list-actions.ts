"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { revalidatePath } from "next/cache"
import slugify from "slugify"
import { nanoid } from "nanoid"

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
