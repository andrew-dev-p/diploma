import { getGenres } from "@/lib/tmdb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const data = await getGenres()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ genres: [] }, { status: 500 })
  }
}
