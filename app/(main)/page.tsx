import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MovieCard } from "@/components/movie-card"
import { ListCard } from "@/components/list-card"
import { getTrending } from "@/lib/tmdb"
import { db } from "@/lib/db"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { AITrendingBanner } from "@/components/ai-trending-banner"

export default async function HomePage() {
  // Parallelize all data fetching for faster page load
  const [trendingResult, listsResult] = await Promise.allSettled([
    getTrending("week"),
    db.movieList.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { username: true, imageUrl: true } },
        items: {
          take: 4,
          orderBy: { order: "asc" },
          select: { posterPath: true },
        },
        tags: { select: { name: true } },
        _count: { select: { likes: true, items: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ])

  const trendingMovies =
    trendingResult.status === "fulfilled"
      ? trendingResult.value.results.slice(0, 20)
      : []

  const featuredLists =
    listsResult.status === "fulfilled" ? listsResult.value : []

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Curate Your Perfect
              <br />
              <span className="text-primary">Movie Collection</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create personalized movie lists, discover films, rate and track
              your watching journey with AI-powered insights.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/discover">
                <Button variant="outline" size="lg">
                  Discover Movies
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Trending Banner */}
      <AITrendingBanner />

      {/* Trending Movies */}
      {trendingMovies.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">
              Trending This Week
            </h2>
            <Link href="/discover">
              <Button variant="ghost" size="sm">
                Discover more
              </Button>
            </Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {trendingMovies.map((movie) => (
                <div key={movie.id} className="w-[160px] shrink-0">
                  <MovieCard
                    id={movie.id}
                    title={movie.title}
                    posterPath={movie.poster_path}
                    year={movie.release_date?.split("-")[0]}
                    rating={movie.vote_average}
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Featured Lists */}
      {featuredLists.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">Featured Lists</h2>
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredLists.map((list) => (
              <ListCard
                key={list.id}
                id={list.id}
                name={list.name}
                description={list.description}
                slug={list.slug}
                itemCount={list._count.items}
                likeCount={list._count.likes}
                posters={list.items.map((i) => i.posterPath)}
                author={list.user}
                tags={list.tags.map((t) => t.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center font-heading text-2xl font-bold">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Create a List",
                desc: "Sign up and start building your movie collection with our powerful search.",
              },
              {
                step: "2",
                title: "Rate & Track",
                desc: "Rate movies, build your watchlist, and track your watching history.",
              },
              {
                step: "3",
                title: "AI Insights",
                desc: "Get AI-generated descriptions, smart suggestions, and trending picks.",
              },
              {
                step: "4",
                title: "Share & Discover",
                desc: "Make your list public, fork others' lists, and explore community curation.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
