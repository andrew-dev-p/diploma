import Link from "next/link";
import type { Metadata } from "next";
import { discoverMovies, getGenres } from "@/lib/tmdb";
import { MovieCard } from "@/components/movie-card";
import { DiscoverFilters } from "@/components/discover-filters";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Discover Movies — CineList",
  description: "Explore movies by genre, year, rating, and more.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    genre?: string;
    year_from?: string;
    year_to?: string;
    rating_min?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");

  const [genresData, moviesData] = await Promise.all([
    getGenres(),
    discoverMovies({
      page,
      sort_by: sp.sort ?? "popularity.desc",
      with_genres: sp.genre ?? undefined,
      "primary_release_date.gte": sp.year_from
        ? `${sp.year_from}-01-01`
        : undefined,
      "primary_release_date.lte": sp.year_to
        ? `${sp.year_to}-12-31`
        : undefined,
      "vote_average.gte": sp.rating_min ?? undefined,
      "vote_count.gte": "50",
    }),
  ]);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (sp.genre) params.set("genre", sp.genre);
    if (sp.year_from) params.set("year_from", sp.year_from);
    if (sp.year_to) params.set("year_to", sp.year_to);
    if (sp.rating_min) params.set("rating_min", sp.rating_min);
    if (sp.sort) params.set("sort", sp.sort);
    params.set("page", String(p));
    return `/discover?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Discover Movies</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Explore movies by genre, year, rating, and more.
        </p>
      </div>

      <DiscoverFilters
        genres={genresData.genres}
        currentGenre={sp.genre}
        currentYearFrom={sp.year_from}
        currentYearTo={sp.year_to}
        currentRatingMin={sp.rating_min}
        currentSort={sp.sort}
      />

      {/* Results */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {moviesData.results.map((movie) => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            year={movie.release_date?.split("-")[0]}
            rating={movie.vote_average}
          />
        ))}
      </div>

      {moviesData.results.length === 0 && (
        <div className="text-muted-foreground py-16 text-center">
          No movies found with these filters.
        </div>
      )}

      {/* Pagination */}
      {moviesData.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={buildUrl(page - 1)}>
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          )}
          <span className="text-muted-foreground text-sm">
            Page {page} of {Math.min(moviesData.total_pages, 500)}
          </span>
          {page < moviesData.total_pages && page < 500 && (
            <Link href={buildUrl(page + 1)}>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
