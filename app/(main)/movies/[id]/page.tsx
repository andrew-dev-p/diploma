import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import {
  getMovie,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  tmdbImageUrl,
} from "@/lib/tmdb";
import {
  getUserRating,
  isInWatchlist,
  isWatched,
} from "@/lib/actions/movie-actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MovieCard } from "@/components/movie-card";
import {
  WatchlistButton,
  MarkWatchedButton,
  StarRating,
} from "@/components/movie-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovie(parseInt(id));
    return {
      title: `${movie.title} — CineList`,
      description: movie.overview?.slice(0, 160),
    };
  } catch {
    return { title: "Movie Not Found" };
  }
}

function formatCurrency(num: number) {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = parseInt(id);

  let movie;
  let credits;
  let videos;
  let similar;
  try {
    [movie, credits, videos, similar] = await Promise.all([
      getMovie(tmdbId),
      getMovieCredits(tmdbId),
      getMovieVideos(tmdbId),
      getSimilarMovies(tmdbId),
    ]);
  } catch {
    notFound();
  }

  // Auth-dependent data
  const { userId: clerkId } = await auth();
  let userRating: number | null = null;
  let inWatchlist = false;
  let watched = false;

  if (clerkId) {
    [userRating, inWatchlist, watched] = await Promise.all([
      getUserRating(tmdbId),
      isInWatchlist(tmdbId),
      isWatched(tmdbId),
    ]);
  }

  const backdropUrl = tmdbImageUrl(movie.backdrop_path, "w1280");
  const posterUrl = tmdbImageUrl(movie.poster_path, "w500");
  const year = movie.release_date?.split("-")[0];
  const director = credits.crew.find((c) => c.job === "Director");
  const writers = credits.crew
    .filter((c) => c.job === "Screenplay" || c.job === "Writer")
    .slice(0, 3);
  const cinematographer = credits.crew.find(
    (c) => c.job === "Director of Photography"
  );
  const composer = credits.crew.find(
    (c) => c.job === "Original Music Composer"
  );
  const cast = credits.cast.slice(0, 12);

  // Find YouTube trailer
  const trailer = videos.results.find(
    (v) =>
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser") &&
      v.official
  ) ?? videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer");

  const similarMovies = similar.results.slice(0, 10);

  const movieData = {
    tmdbId,
    title: movie.title,
    posterPath: movie.poster_path,
    year: year ?? "",
    runtime: movie.runtime ?? undefined,
    genreIds: movie.genres?.map((g) => g.id),
  };

  return (
    <div>
      {/* Backdrop */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 md:h-[28rem]">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="from-background absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-8 md:flex-row ${backdropUrl ? "relative -mt-32" : "pt-8"}`}
        >
          {/* Poster */}
          {posterUrl && (
            <div className="bg-muted relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-xl shadow-lg md:w-56">
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="224px"
                priority
              />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 pt-4 md:pt-8">
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-muted-foreground mt-1 italic">
                {movie.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {year && <Badge variant="outline">{year}</Badge>}
              {movie.runtime && (
                <Badge variant="outline">{movie.runtime} min</Badge>
              )}
              {movie.vote_average > 0 && (
                <Badge variant="secondary">
                  {movie.vote_average.toFixed(1)} / 10
                </Badge>
              )}
              {movie.genres?.map((g) => (
                <Link key={g.id} href={`/discover?genre=${g.id}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                  >
                    {g.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Crew info */}
            <div className="text-muted-foreground mt-4 space-y-1 text-sm">
              {director && (
                <p>
                  Directed by{" "}
                  <Link
                    href={`/person/${director.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {director.name}
                  </Link>
                </p>
              )}
              {writers.length > 0 && (
                <p>
                  Written by{" "}
                  {writers.map((w, i) => (
                    <span key={w.id}>
                      <Link
                        href={`/person/${w.id}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {w.name}
                      </Link>
                      {i < writers.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
              {cinematographer && (
                <p>
                  Cinematography by{" "}
                  <Link
                    href={`/person/${cinematographer.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {cinematographer.name}
                  </Link>
                </p>
              )}
              {composer && (
                <p>
                  Music by{" "}
                  <Link
                    href={`/person/${composer.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {composer.name}
                  </Link>
                </p>
              )}
            </div>

            {movie.overview && (
              <p className="mt-4 leading-relaxed">{movie.overview}</p>
            )}

            {/* Budget & Revenue */}
            {(movie.budget || movie.revenue) && (
              <div className="mt-4 flex gap-6 text-sm">
                {movie.budget ? (
                  <div>
                    <span className="text-muted-foreground">Budget: </span>
                    <span className="font-medium">
                      {formatCurrency(movie.budget)}
                    </span>
                  </div>
                ) : null}
                {movie.revenue ? (
                  <div>
                    <span className="text-muted-foreground">Revenue: </span>
                    <span className="font-medium">
                      {formatCurrency(movie.revenue)}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Action buttons (auth only) */}
            {clerkId && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <WatchlistButton
                  movie={movieData}
                  initialInWatchlist={inWatchlist}
                />
                <MarkWatchedButton
                  movie={movieData}
                  initialWatched={watched}
                />
              </div>
            )}
          </div>
        </div>

        {/* User Rating */}
        {clerkId && (
          <>
            <Separator className="my-8" />
            <StarRating tmdbId={tmdbId} initialRating={userRating} />
          </>
        )}

        {/* Trailer */}
        {trailer && (
          <>
            <Separator className="my-8" />
            <div>
              <h2 className="font-heading mb-4 text-xl font-bold">Trailer</h2>
              <div className="aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          </>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <>
            <Separator className="my-8" />
            <div>
              <h2 className="font-heading mb-4 text-xl font-bold">Cast</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {cast.map((person) => {
                  const profileUrl = tmdbImageUrl(person.profile_path, "w185");
                  return (
                    <Link
                      key={person.id}
                      href={`/person/${person.id}`}
                      className="group text-center"
                    >
                      <div className="bg-muted relative mx-auto aspect-square w-20 overflow-hidden rounded-full transition-transform group-hover:scale-105">
                        {profileUrl ? (
                          <Image
                            src={profileUrl}
                            alt={person.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="text-muted-foreground/50"
                            >
                              <circle cx="12" cy="8" r="5" />
                              <path d="M20 21a8 8 0 1 0-16 0" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium line-clamp-1 group-hover:underline">
                        {person.name}
                      </p>
                      <p className="text-muted-foreground text-[11px] line-clamp-1">
                        {person.character}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <>
            <Separator className="my-8" />
            <div className="pb-16">
              <h2 className="font-heading mb-4 text-xl font-bold">
                Similar Movies
              </h2>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {similarMovies.map((m) => (
                    <div key={m.id} className="w-[140px] shrink-0">
                      <MovieCard
                        id={m.id}
                        title={m.title}
                        posterPath={m.poster_path}
                        year={m.release_date?.split("-")[0]}
                        rating={m.vote_average}
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
