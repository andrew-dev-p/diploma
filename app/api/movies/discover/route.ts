import { discoverMovies } from "@/lib/tmdb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  try {
    const data = await discoverMovies({
      page: parseInt(sp.get("page") ?? "1"),
      sort_by: sp.get("sort_by") ?? "popularity.desc",
      with_genres: sp.get("with_genres") ?? undefined,
      "primary_release_date.gte": sp.get("year_from")
        ? `${sp.get("year_from")}-01-01`
        : undefined,
      "primary_release_date.lte": sp.get("year_to")
        ? `${sp.get("year_to")}-12-31`
        : undefined,
      "vote_average.gte": sp.get("rating_min") ?? undefined,
      "vote_average.lte": sp.get("rating_max") ?? undefined,
      "vote_count.gte": sp.get("vote_count_min") ?? "50",
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { results: [], total_pages: 0, total_results: 0 },
      { status: 500 }
    )
  }
}
