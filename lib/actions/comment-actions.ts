"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { revalidatePath } from "next/cache"

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

export async function deleteComment(commentId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await syncUser()
  if (!user) throw new Error("User sync failed")

  await db.listComment.delete({
    where: { id: commentId, userId: user.id },
  })
}

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
