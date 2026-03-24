import { searchMovies } from "@/lib/tmdb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")
  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const page = req.nextUrl.searchParams.get("page") ?? "1"
  const data = await searchMovies(query, parseInt(page))
  return NextResponse.json(data)
}
