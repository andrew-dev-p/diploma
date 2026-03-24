const TMDB_BASE = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export const tmdbImageUrl = (path: string | null, size = "w500") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null

interface TMDBFetchOptions {
  path: string
  params?: Record<string, string>
}

async function tmdbFetch<T>({ path, params }: TMDBFetchOptions): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

// ─── Types ───────────────────────────────────────────────────

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  runtime?: number
  tagline?: string
  budget?: number
  revenue?: number
  status?: string
  original_language?: string
  production_companies?: {
    id: number
    name: string
    logo_path: string | null
  }[]
}

export interface TMDBSearchResult {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface TMDBCredits {
  cast: {
    id: number
    name: string
    character: string
    profile_path: string | null
    order: number
  }[]
  crew: {
    id: number
    name: string
    job: string
    department: string
    profile_path: string | null
  }[]
}

export interface TMDBVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBPerson {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  also_known_as: string[]
}

export interface TMDBPersonCredits {
  cast: {
    id: number
    title: string
    character: string
    poster_path: string | null
    release_date: string
    vote_average: number
    popularity: number
  }[]
  crew: {
    id: number
    title: string
    job: string
    department: string
    poster_path: string | null
    release_date: string
    vote_average: number
    popularity: number
  }[]
}

export interface TMDBGenre {
  id: number
  name: string
}

// ─── API Functions ───────────────────────────────────────────

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch<TMDBSearchResult>({
    path: "/search/movie",
    params: { query, page: String(page), include_adult: "false" },
  })
}

export async function getMovie(id: number) {
  return tmdbFetch<TMDBMovie>({ path: `/movie/${id}` })
}

export async function getTrending(timeWindow: "day" | "week" = "week") {
  return tmdbFetch<TMDBSearchResult>({
    path: `/trending/movie/${timeWindow}`,
  })
}

export async function getPopular(page = 1) {
  return tmdbFetch<TMDBSearchResult>({
    path: "/movie/popular",
    params: { page: String(page) },
  })
}

export async function getMovieCredits(id: number) {
  return tmdbFetch<TMDBCredits>({ path: `/movie/${id}/credits` })
}

export async function getMovieVideos(id: number) {
  return tmdbFetch<{ results: TMDBVideo[] }>({
    path: `/movie/${id}/videos`,
  })
}

export async function getSimilarMovies(id: number) {
  return tmdbFetch<TMDBSearchResult>({
    path: `/movie/${id}/similar`,
  })
}

export async function getPerson(id: number) {
  return tmdbFetch<TMDBPerson>({ path: `/person/${id}` })
}

export async function getPersonMovieCredits(id: number) {
  return tmdbFetch<TMDBPersonCredits>({
    path: `/person/${id}/movie_credits`,
  })
}

export async function getGenres() {
  return tmdbFetch<{ genres: TMDBGenre[] }>({
    path: "/genre/movie/list",
  })
}

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
