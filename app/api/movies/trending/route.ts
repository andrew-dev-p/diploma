import { getTrending } from "@/lib/tmdb"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getTrending("week")
  return NextResponse.json(data)
}
