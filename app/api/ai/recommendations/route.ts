import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUser } from "@/lib/user-sync";
import { generateRecommendations } from "@/lib/ai";
import { searchMovies } from "@/lib/tmdb";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await syncUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { listId } = await req.json();

  const list = await db.movieList.findUnique({
    where: { id: listId, userId: user.id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (list.items.length === 0) {
    return NextResponse.json(
      { error: "Add movies to the list first" },
      { status: 400 }
    );
  }

  const recommendations = await generateRecommendations(
    list.items.map((i) => ({ title: i.title, year: i.year ?? "" }))
  );

  // Enrich with TMDB data
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      try {
        const results = await searchMovies(`${rec.title} ${rec.year}`);
        const match = results.results[0];
        if (match) {
          return {
            tmdbId: match.id,
            title: match.title,
            posterPath: match.poster_path,
            year: match.release_date?.split("-")[0] ?? rec.year,
            rating: match.vote_average,
          };
        }
      } catch {
        // skip failed searches
      }
      return null;
    })
  );

  return NextResponse.json({
    recommendations: enriched.filter(Boolean),
  });
}
