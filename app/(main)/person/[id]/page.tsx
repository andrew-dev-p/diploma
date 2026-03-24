import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getPerson, getPersonMovieCredits, tmdbImageUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MovieCard } from "@/components/movie-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const person = await getPerson(parseInt(id));
    return {
      title: `${person.name} — CineList`,
      description: person.biography?.slice(0, 160),
    };
  } catch {
    return { title: "Person Not Found" };
  }
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let person;
  let movieCredits;
  try {
    [person, movieCredits] = await Promise.all([
      getPerson(parseInt(id)),
      getPersonMovieCredits(parseInt(id)),
    ]);
  } catch {
    notFound();
  }

  const profileUrl = tmdbImageUrl(person.profile_path, "w500");

  // Known for: sorted by popularity, deduplicated
  const seenIds = new Set<number>();
  const allCredits = [
    ...movieCredits.cast.map((c) => ({
      ...c,
      role: c.character,
      type: "cast" as const,
    })),
    ...movieCredits.crew.map((c) => ({
      ...c,
      role: c.job,
      type: "crew" as const,
    })),
  ]
    .filter((c) => {
      if (seenIds.has(c.id)) return false;
      seenIds.add(c.id);
      return c.poster_path && c.release_date;
    })
    .sort((a, b) => b.popularity - a.popularity);

  const knownFor = allCredits.slice(0, 8);

  // Full filmography sorted by release date (newest first)
  const filmography = allCredits
    .sort(
      (a, b) =>
        new Date(b.release_date).getTime() -
        new Date(a.release_date).getTime()
    );

  const age = person.birthday
    ? Math.floor(
        (Date.now() -
          new Date(
            person.deathday ?? person.birthday
          ).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000) +
          (person.deathday
            ? (new Date(person.deathday).getTime() -
                new Date(person.birthday).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
            : 0)
      )
    : null;

  // Simpler age calculation
  const calcAge = person.birthday
    ? Math.floor(
        (new Date(person.deathday ?? Date.now()).getTime() -
          new Date(person.birthday).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Photo */}
        <div className="shrink-0">
          <div className="bg-muted relative aspect-[2/3] w-48 overflow-hidden rounded-xl md:w-64">
            {profileUrl ? (
              <Image
                src={profileUrl}
                alt={person.name}
                fill
                className="object-cover"
                sizes="256px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted-foreground/50"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {person.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{person.known_for_department}</Badge>
            {person.birthday && (
              <Badge variant="outline">
                Born {new Date(person.birthday).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {calcAge !== null && !person.deathday && ` (age ${calcAge})`}
              </Badge>
            )}
            {person.deathday && (
              <Badge variant="outline">
                Died {new Date(person.deathday).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {calcAge !== null && ` (age ${calcAge})`}
              </Badge>
            )}
            {person.place_of_birth && (
              <Badge variant="outline">{person.place_of_birth}</Badge>
            )}
          </div>

          {person.biography && (
            <div className="mt-4">
              <p className="text-muted-foreground leading-relaxed line-clamp-[8]">
                {person.biography}
              </p>
            </div>
          )}

          <div className="text-muted-foreground mt-3 text-sm">
            {filmography.length} credits
          </div>
        </div>
      </div>

      {/* Known For */}
      {knownFor.length > 0 && (
        <>
          <Separator className="my-8" />
          <h2 className="font-heading mb-4 text-xl font-bold">Known For</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {knownFor.map((m) => (
              <MovieCard
                key={m.id}
                id={m.id}
                title={m.title}
                posterPath={m.poster_path}
                year={m.release_date?.split("-")[0]}
                rating={m.vote_average}
              />
            ))}
          </div>
        </>
      )}

      {/* Full Filmography */}
      {filmography.length > 0 && (
        <>
          <Separator className="my-8" />
          <h2 className="font-heading mb-4 text-xl font-bold">Filmography</h2>
          <div className="space-y-2">
            {filmography.map((m) => (
              <a
                key={`${m.id}-${m.role}`}
                href={`/movies/${m.id}`}
                className="bg-card hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <div className="bg-muted relative h-16 w-11 shrink-0 overflow-hidden rounded">
                  {m.poster_path ? (
                    <Image
                      src={tmdbImageUrl(m.poster_path, "w92")!}
                      alt={m.title}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center text-xs">
                      ?
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.release_date?.split("-")[0]}
                    {m.role && ` · ${m.role}`}
                  </p>
                </div>
                {m.vote_average > 0 && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {m.vote_average.toFixed(1)}
                  </Badge>
                )}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
