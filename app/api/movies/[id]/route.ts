import { getMovie } from "@/lib/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movie = await getMovie(parseInt(id));
  return NextResponse.json(movie);
}
