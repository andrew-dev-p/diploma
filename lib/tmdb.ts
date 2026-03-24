/**
 * @module tmdb
 *
 * Wrapper around The Movie Database (TMDB) REST API v3.
 *
 * Provides typed helper functions for searching, browsing, and retrieving
 * movie and person data from TMDB. All requests are authenticated via a
 * Bearer token read from the `TMDB_ACCESS_TOKEN` environment variable and
 * are cached with a one-hour revalidation window (Next.js `fetch` cache).
 *
 * @see https://developer.themoviedb.org/reference/intro/getting-started
 */

const TMDB_BASE = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

/**
 * Build a full TMDB image URL from a relative image path.
 *
 * TMDB stores images with relative paths (e.g. `"/abc123.jpg"`).
 * This helper prepends the CDN base URL and the requested size.
 *
 * @param path  - The relative image path returned by TMDB, or `null`.
 * @param size  - The TMDB image size preset (e.g. `"w200"`, `"w500"`, `"original"`).
 *                Defaults to `"w500"`.
 * @returns The fully-qualified image URL, or `null` when `path` is falsy.
 *
 * @example
 * ```ts
 * tmdbImageUrl("/abc123.jpg");           // "https://image.tmdb.org/t/p/w500/abc123.jpg"
 * tmdbImageUrl("/abc123.jpg", "w200");   // "https://image.tmdb.org/t/p/w200/abc123.jpg"
 * tmdbImageUrl(null);                    // null
 * ```
 */
export const tmdbImageUrl = (path: string | null, size = "w500") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null

/**
 * Options passed to the internal {@link tmdbFetch} helper.
 */
interface TMDBFetchOptions {
  /** TMDB API path segment (e.g. `"/movie/123"`). */
  path: string
  /** Optional query-string parameters appended to the request URL. */
  params?: Record<string, string>
}

/**
 * Internal fetch wrapper that handles TMDB authentication, URL construction,
 * query-string serialisation, caching, and error handling.
 *
 * @template T - The expected JSON response shape.
 * @param options - The request path and optional query parameters.
 * @returns A promise that resolves to the parsed JSON body typed as `T`.
 * @throws {Error} When the response status is not OK.
 *
 * @internal
 */
async function tmdbFetch<T>({ path, params }: TMDBFetchOptions): Promise<T> {
  const { createModuleLogger } = await import("@/lib/logger")
  const log = createModuleLogger("tmdb")

  const url = new URL(`${TMDB_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  log.debug({ path, params }, "TMDB API request")

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    log.error(
      { path, status: res.status, statusText: res.statusText },
      "TMDB API request failed"
    )
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`)
  }

  log.debug({ path, status: res.status }, "TMDB API response OK")
  return res.json() as Promise<T>
}

// ─── Types ───────────────────────────────────────────────────

/**
 * Represents a movie object returned by TMDB.
 *
 * Properties marked as optional are only present when fetching full movie
 * details (e.g. via {@link getMovie}) and are absent in list/search results.
 */
export interface TMDBMovie {
  /** Unique TMDB movie identifier. */
  id: number
  /** Localised movie title. */
  title: string
  /** Short plot summary. */
  overview: string
  /** Relative path to the poster image, or `null` if unavailable. */
  poster_path: string | null
  /** Relative path to the backdrop image, or `null` if unavailable. */
  backdrop_path: string | null
  /** Release date in `"YYYY-MM-DD"` format. */
  release_date: string
  /** Average user rating on a 0-10 scale. */
  vote_average: number
  /** Total number of user votes. */
  vote_count: number
  /** Genre IDs (present in search/list results). */
  genre_ids?: number[]
  /** Full genre objects (present in detail responses). */
  genres?: { id: number; name: string }[]
  /** Runtime in minutes (detail only). */
  runtime?: number
  /** Short tagline (detail only). */
  tagline?: string
  /** Production budget in USD (detail only). */
  budget?: number
  /** Worldwide box-office revenue in USD (detail only). */
  revenue?: number
  /** Release status, e.g. `"Released"`, `"In Production"` (detail only). */
  status?: string
  /** ISO 639-1 language code of the original language (detail only). */
  original_language?: string
  /** Production companies involved (detail only). */
  production_companies?: {
    id: number
    name: string
    logo_path: string | null
  }[]
}

/**
 * Paginated search/list response returned by endpoints such as
 * `/search/movie`, `/movie/popular`, and `/discover/movie`.
 */
export interface TMDBSearchResult {
  /** Current page number (1-based). */
  page: number
  /** Array of movie objects on this page. */
  results: TMDBMovie[]
  /** Total number of available pages. */
  total_pages: number
  /** Total number of matching results across all pages. */
  total_results: number
}

/**
 * Cast and crew credits for a movie, as returned by
 * `/movie/{id}/credits`.
 */
export interface TMDBCredits {
  /** Ordered list of cast members. */
  cast: {
    /** TMDB person ID. */
    id: number
    /** Actor's name. */
    name: string
    /** Character name portrayed. */
    character: string
    /** Relative path to the actor's profile image, or `null`. */
    profile_path: string | null
    /** Display order (lower is more prominent). */
    order: number
  }[]
  /** List of crew members. */
  crew: {
    /** TMDB person ID. */
    id: number
    /** Crew member's name. */
    name: string
    /** Specific job title (e.g. `"Director"`, `"Screenplay"`). */
    job: string
    /** Department (e.g. `"Directing"`, `"Writing"`). */
    department: string
    /** Relative path to the crew member's profile image, or `null`. */
    profile_path: string | null
  }[]
}

/**
 * A video resource (trailer, teaser, featurette, etc.) associated with a movie.
 */
export interface TMDBVideo {
  /** Unique TMDB video identifier. */
  id: string
  /** Platform-specific video key (e.g. a YouTube video ID). */
  key: string
  /** Display name of the video. */
  name: string
  /** Hosting platform (e.g. `"YouTube"`, `"Vimeo"`). */
  site: string
  /** Video type (e.g. `"Trailer"`, `"Teaser"`, `"Featurette"`). */
  type: string
  /** Whether the video is an official release from the studio. */
  official: boolean
}

/**
 * Biographical information for a person (actor, director, etc.)
 * as returned by `/person/{id}`.
 */
export interface TMDBPerson {
  /** Unique TMDB person identifier. */
  id: number
  /** Full name. */
  name: string
  /** Free-text biography. */
  biography: string
  /** Date of birth in `"YYYY-MM-DD"` format, or `null` if unknown. */
  birthday: string | null
  /** Date of death in `"YYYY-MM-DD"` format, or `null` if still alive / unknown. */
  deathday: string | null
  /** Place of birth as a free-text string, or `null`. */
  place_of_birth: string | null
  /** Relative path to the profile image, or `null`. */
  profile_path: string | null
  /** Primary known-for department (e.g. `"Acting"`, `"Directing"`). */
  known_for_department: string
  /** Alternative or translated names. */
  also_known_as: string[]
}

/**
 * Movie credits (cast and crew roles) for a specific person,
 * as returned by `/person/{id}/movie_credits`.
 */
export interface TMDBPersonCredits {
  /** Movies in which the person appeared as a cast member. */
  cast: {
    /** TMDB movie ID. */
    id: number
    /** Movie title. */
    title: string
    /** Character name portrayed. */
    character: string
    /** Relative path to the movie poster, or `null`. */
    poster_path: string | null
    /** Release date in `"YYYY-MM-DD"` format. */
    release_date: string
    /** Average user rating (0-10). */
    vote_average: number
    /** TMDB popularity score. */
    popularity: number
  }[]
  /** Movies in which the person served as a crew member. */
  crew: {
    /** TMDB movie ID. */
    id: number
    /** Movie title. */
    title: string
    /** Crew job title. */
    job: string
    /** Department (e.g. `"Directing"`). */
    department: string
    /** Relative path to the movie poster, or `null`. */
    poster_path: string | null
    /** Release date in `"YYYY-MM-DD"` format. */
    release_date: string
    /** Average user rating (0-10). */
    vote_average: number
    /** TMDB popularity score. */
    popularity: number
  }[]
}

/**
 * A movie genre as returned by `/genre/movie/list`.
 */
export interface TMDBGenre {
  /** Unique genre identifier. */
  id: number
  /** Human-readable genre name (e.g. `"Action"`, `"Comedy"`). */
  name: string
}

// ─── API Functions ───────────────────────────────────────────

/**
 * Search for movies by a text query.
 *
 * Calls TMDB's `/search/movie` endpoint with adult content excluded.
 *
 * @param query - The search string (movie title or keywords).
 * @param page  - The results page to retrieve (1-based). Defaults to `1`.
 * @returns A paginated {@link TMDBSearchResult} containing matching movies.
 *
 * @example
 * ```ts
 * const results = await searchMovies("Inception");
 * console.log(results.results[0].title); // "Inception"
 * ```
 */
export async function searchMovies(query: string, page = 1) {
  return tmdbFetch<TMDBSearchResult>({
    path: "/search/movie",
    params: { query, page: String(page), include_adult: "false" },
  })
}

/**
 * Fetch full details for a single movie by its TMDB ID.
 *
 * Returns additional fields such as `runtime`, `tagline`, `budget`,
 * `revenue`, `genres`, and `production_companies` that are not present
 * in list/search results.
 *
 * @param id - The TMDB movie ID.
 * @returns A {@link TMDBMovie} object with full detail fields populated.
 *
 * @example
 * ```ts
 * const movie = await getMovie(550);
 * console.log(movie.title); // "Fight Club"
 * ```
 */
export async function getMovie(id: number) {
  return tmdbFetch<TMDBMovie>({ path: `/movie/${id}` })
}

/**
 * Fetch trending movies for a given time window.
 *
 * @param timeWindow - Either `"day"` for daily trends or `"week"` for
 *                     weekly trends. Defaults to `"week"`.
 * @returns A paginated {@link TMDBSearchResult} of trending movies.
 *
 * @example
 * ```ts
 * const weekly = await getTrending("week");
 * const daily  = await getTrending("day");
 * ```
 */
export async function getTrending(timeWindow: "day" | "week" = "week") {
  return tmdbFetch<TMDBSearchResult>({
    path: `/trending/movie/${timeWindow}`,
  })
}

/**
 * Fetch the current list of popular movies.
 *
 * @param page - The results page to retrieve (1-based). Defaults to `1`.
 * @returns A paginated {@link TMDBSearchResult} of popular movies.
 *
 * @example
 * ```ts
 * const popular = await getPopular(2); // page 2
 * ```
 */
export async function getPopular(page = 1) {
  return tmdbFetch<TMDBSearchResult>({
    path: "/movie/popular",
    params: { page: String(page) },
  })
}

/**
 * Fetch cast and crew credits for a movie.
 *
 * @param id - The TMDB movie ID.
 * @returns A {@link TMDBCredits} object containing `cast` and `crew` arrays.
 *
 * @example
 * ```ts
 * const credits = await getMovieCredits(550);
 * const director = credits.crew.find(c => c.job === "Director");
 * ```
 */
export async function getMovieCredits(id: number) {
  return tmdbFetch<TMDBCredits>({ path: `/movie/${id}/credits` })
}

/**
 * Fetch videos (trailers, teasers, featurettes) associated with a movie.
 *
 * @param id - The TMDB movie ID.
 * @returns An object with a `results` array of {@link TMDBVideo} entries.
 *
 * @example
 * ```ts
 * const { results } = await getMovieVideos(550);
 * const trailer = results.find(v => v.type === "Trailer");
 * ```
 */
export async function getMovieVideos(id: number) {
  return tmdbFetch<{ results: TMDBVideo[] }>({
    path: `/movie/${id}/videos`,
  })
}

/**
 * Fetch movies similar to a given movie.
 *
 * @param id - The TMDB movie ID to find similar titles for.
 * @returns A paginated {@link TMDBSearchResult} of similar movies.
 *
 * @example
 * ```ts
 * const similar = await getSimilarMovies(550);
 * ```
 */
export async function getSimilarMovies(id: number) {
  return tmdbFetch<TMDBSearchResult>({
    path: `/movie/${id}/similar`,
  })
}

/**
 * Fetch biographical details for a person (actor, director, etc.).
 *
 * @param id - The TMDB person ID.
 * @returns A {@link TMDBPerson} object with full biographical data.
 *
 * @example
 * ```ts
 * const person = await getPerson(287);
 * console.log(person.name); // "Brad Pitt"
 * ```
 */
export async function getPerson(id: number) {
  return tmdbFetch<TMDBPerson>({ path: `/person/${id}` })
}

/**
 * Fetch the movie credits (cast and crew roles) for a specific person.
 *
 * @param id - The TMDB person ID.
 * @returns A {@link TMDBPersonCredits} object with `cast` and `crew` arrays.
 *
 * @example
 * ```ts
 * const credits = await getPersonMovieCredits(287);
 * const actingRoles = credits.cast;
 * ```
 */
export async function getPersonMovieCredits(id: number) {
  return tmdbFetch<TMDBPersonCredits>({
    path: `/person/${id}/movie_credits`,
  })
}

/**
 * Fetch the official list of movie genres from TMDB.
 *
 * @returns An object containing a `genres` array of {@link TMDBGenre} entries.
 *
 * @example
 * ```ts
 * const { genres } = await getGenres();
 * // [{ id: 28, name: "Action" }, { id: 12, name: "Adventure" }, ...]
 * ```
 */
export async function getGenres() {
  return tmdbFetch<{ genres: TMDBGenre[] }>({
    path: "/genre/movie/list",
  })
}

/**
 * Discover movies using a flexible set of filters and sorting options.
 *
 * Wraps TMDB's `/discover/movie` endpoint. All filter parameters are
 * optional; when omitted the endpoint returns a broad, unfiltered listing
 * sorted by popularity.
 *
 * @param params - Discovery filter options.
 * @param params.page                       - Results page (1-based).
 * @param params.sort_by                    - Sort order (e.g. `"popularity.desc"`).
 * @param params.with_genres                - Comma-separated genre IDs to include.
 * @param params["primary_release_date.gte"] - Minimum release date (`"YYYY-MM-DD"`).
 * @param params["primary_release_date.lte"] - Maximum release date (`"YYYY-MM-DD"`).
 * @param params["vote_average.gte"]         - Minimum average vote.
 * @param params["vote_average.lte"]         - Maximum average vote.
 * @param params["vote_count.gte"]           - Minimum vote count.
 * @returns A paginated {@link TMDBSearchResult} of discovered movies.
 *
 * @example
 * ```ts
 * const sciFi = await discoverMovies({
 *   with_genres: "878",
 *   sort_by: "vote_average.desc",
 *   "vote_count.gte": "100",
 * });
 * ```
 */
export async function discoverMovies(
  params: {
    page?: number
    sort_by?: string
    with_genres?: string
    "primary_release_date.gte"?: string
    "primary_release_date.lte"?: string
    "vote_average.gte"?: string
    "vote_average.lte"?: string
    "vote_count.gte"?: string
  } = {}
) {
  const stringParams: Record<string, string> = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      stringParams[k] = String(v)
    }
  })
  return tmdbFetch<TMDBSearchResult>({
    path: "/discover/movie",
    params: { include_adult: "false", ...stringParams },
  })
}
