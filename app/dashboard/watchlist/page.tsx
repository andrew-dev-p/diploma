import { redirect } from "next/navigation";
import { syncUser } from "@/lib/user-sync";
import { db } from "@/lib/db";
import { MovieCard } from "@/components/movie-card";

export default async function WatchlistPage() {
  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const items = await db.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {items.length} {items.length === 1 ? "movie" : "movies"} to watch
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground/50 mx-auto mb-4"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          <p className="text-lg font-medium">Your watchlist is empty</p>
          <p className="mt-1 text-sm">
            Browse movies and add them to your watchlist.
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
  );
}
