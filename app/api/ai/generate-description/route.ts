import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { syncUser } from "@/lib/user-sync"
import { generateListDescription } from "@/lib/ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await syncUser()
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { listId } = await req.json()

  const list = await db.movieList.findUnique({
    where: { id: listId, userId: user.id },
    include: { items: { orderBy: { order: "asc" } } },
  })

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 })
  }

  if (list.items.length === 0) {
    return NextResponse.json(
      { error: "Add movies to the list first" },
      { status: 400 }
    )
  }

  const description = await generateListDescription(
    list.name,
    list.items.map((i) => ({ title: i.title, year: i.year ?? "" }))
  )

  if (description) {
    await db.movieList.update({
      where: { id: listId },
      data: { aiDescription: description },
    })
  }

  return NextResponse.json({ description })
}
