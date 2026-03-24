import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListCard } from "@/components/list-card"
import { ListTemplates } from "@/components/list-templates"
import { syncUser } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await syncUser()
  if (!user) redirect("/sign-in")

  const [lists, watchlistCount, historyCount, ratingsCount] = await Promise.all(
    [
      db.movieList.findMany({
        where: { userId: user.id },
        include: {
          items: {
            take: 4,
            orderBy: { order: "asc" },
            select: { posterPath: true },
          },
          tags: { select: { name: true } },
          _count: { select: { likes: true, items: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.watchlistItem.count({ where: { userId: user.id } }),
      db.watchHistoryItem.count({ where: { userId: user.id } }),
      db.movieRating.count({ where: { userId: user.id } }),
    ]
  )

  return (
    <div>
      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/dashboard" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{lists.length}</p>
              <p className="text-xs text-muted-foreground">Lists</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/watchlist" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {watchlistCount}
              </p>
              <p className="text-xs text-muted-foreground">Watchlist</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/history" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{historyCount}</p>
              <p className="text-xs text-muted-foreground">Watched</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/history" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{ratingsCount}</p>
              <p className="text-xs text-muted-foreground">Rated</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">My Lists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lists.length} {lists.length === 1 ? "list" : "lists"} created
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListTemplates />
          <Link href="/dashboard/lists/new">
            <Button className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New List
            </Button>
          </Link>
        </div>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 text-muted-foreground/50"
            >
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            </svg>
            <h3 className="mb-1 font-heading text-lg font-semibold">
              No lists yet
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first movie list to get started.
            </p>
            <Link href="/dashboard/lists/new">
              <Button>Create Your First List</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              id={list.id}
              name={list.name}
              description={list.description}
              slug={list.slug}
              itemCount={list._count.items}
              likeCount={list._count.likes}
              posters={list.items.map((i) => i.posterPath)}
              tags={list.tags.map((t) => t.name)}
              href={`/dashboard/lists/${list.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
