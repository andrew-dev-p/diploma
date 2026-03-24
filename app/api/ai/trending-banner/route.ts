import { getTrending } from "@/lib/tmdb"
import { generateTrendingBanner } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const trending = await getTrending("week")
    const topMovies = trending.results.slice(0, 5).map((m) => ({
      title: m.title,
      year: m.release_date?.split("-")[0] ?? "",
      overview: m.overview,
    }))

    const banner = await generateTrendingBanner(topMovies)
    if (!banner) {
      return NextResponse.json({ error: "Failed to generate" }, { status: 500 })
    }

    // Find the picked movie in trending to get its full data
    const pickedMovie = trending.results.find(
      (m) => m.title.toLowerCase() === banner.pickTitle.toLowerCase()
    )

    return NextResponse.json({
      headline: banner.headline,
      pick: pickedMovie
        ? {
            id: pickedMovie.id,
            title: pickedMovie.title,
            posterPath: pickedMovie.poster_path,
            backdropPath: pickedMovie.backdrop_path,
            year: pickedMovie.release_date?.split("-")[0],
            rating: pickedMovie.vote_average,
            reason: banner.pickReason,
          }
        : null,
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
