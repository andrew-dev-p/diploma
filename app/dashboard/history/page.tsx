import { redirect } from "next/navigation"
import { syncUser } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { MovieCard } from "@/components/movie-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getGenres } from "@/lib/tmdb"

export default async function HistoryPage() {
  const user = await syncUser()
  if (!user) redirect("/sign-in")

  const [items, ratings, genresData] = await Promise.all([
    db.watchHistoryItem.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: "desc" },
    }),
    db.movieRating.findMany({
      where: { userId: user.id },
    }),
    getGenres().catch(() => ({ genres: [] })),
  ])

  // Stats
  const totalWatched = items.length
  const totalRuntime = items.reduce((sum, i) => sum + (i.runtime ?? 0), 0)
  const totalHours = Math.round(totalRuntime / 60)
  const avgRating =
    ratings.length > 0
      ? (
          ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        ).toFixed(1)
      : null

  // Genre breakdown
  const genreCounts: Record<string, number> = {}
  items.forEach((item) => {
    if (item.genreIds) {
      item.genreIds.split(",").forEach((id) => {
        const genre = genresData.genres.find((g) => String(g.id) === id)
        if (genre) {
          genreCounts[genre.name] = (genreCounts[genre.name] ?? 0) + 1
        }
      })
    }
  })
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // Decade breakdown
  const decadeCounts: Record<string, number> = {}
  items.forEach((item) => {
    if (item.year) {
      const decade = `${item.year.slice(0, 3)}0s`
      decadeCounts[decade] = (decadeCounts[decade] ?? 0) + 1
    }
  })
  const topDecades = Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Watch History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your movie watching journey.
        </p>
      </div>

      {/* Stats */}
      {totalWatched > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalWatched}</p>
              <p className="text-xs text-muted-foreground">Movies Watched</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total Runtime</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {avgRating ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Rating</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {ratings.length}
              </p>
              <p className="text-xs text-muted-foreground">Movies Rated</p>
            </div>
          </div>

          {/* Genre & decade breakdown */}
          {(topGenres.length > 0 || topDecades.length > 0) && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {topGenres.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium">Top Genres</h3>
                  <div className="space-y-2">
                    {topGenres.map(([genre, count]) => (
                      <div key={genre} className="flex items-center gap-2">
                        <span className="w-20 truncate text-sm">{genre}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(count / topGenres[0][1]) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {topDecades.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium">Decades</h3>
                  <div className="flex flex-wrap gap-2">
                    {topDecades.map(([decade, count]) => (
                      <Badge key={decade} variant="secondary">
                        {decade} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator className="my-8" />
        </>
      )}

      {/* Movie grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto mb-4 text-muted-foreground/50"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-lg font-medium">No watch history yet</p>
          <p className="mt-1 text-sm">
            Mark movies as watched from any movie page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <MovieCard
              key={item.id}
              id={item.tmdbId}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
