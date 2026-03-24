import { db } from "@/lib/db";
import { ListCard } from "@/components/list-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = {
  title: "Explore Lists — CineList",
  description: "Discover curated movie lists from the community.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const { q: search, tag, page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? "1");
  const perPage = 12;

  const where = {
    isPublic: true,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(tag ? { tags: { some: { name: tag } } } : {}),
  };

  const [lists, total, popularTags] = await Promise.all([
    db.movieList.findMany({
      where,
      include: {
        user: { select: { username: true, imageUrl: true } },
        items: {
          take: 4,
          orderBy: { order: "asc" },
          select: { posterPath: true },
        },
        tags: { select: { name: true } },
        _count: { select: { likes: true, items: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    db.movieList.count({ where }),
    db.listTag.findMany({
      select: { name: true },
    }),
  ]);

  // Aggregate tag counts
  const tagCountMap: Record<string, number> = {};
  for (const t of popularTags) {
    tagCountMap[t.name] = (tagCountMap[t.name] ?? 0) + 1;
  }
  const aggregatedTags = Object.entries(tagCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, _count: { name: count } }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Explore Lists</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Discover curated movie collections from the community.
        </p>
      </div>

      {/* Search */}
      <form className="mb-4 flex gap-2" action="/explore" method="GET">
        <Input
          name="q"
          placeholder="Search lists..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        {tag && <input type="hidden" name="tag" value={tag} />}
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {(search || tag) && (
          <Link href="/explore">
            <Button variant="ghost">Clear</Button>
          </Link>
        )}
      </form>

      {/* Popular tags */}
      {aggregatedTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          {aggregatedTags.map((t) => (
            <Link key={t.name} href={`/explore?tag=${t.name}`}>
              <Badge
                variant={tag === t.name ? "default" : "outline"}
                className="cursor-pointer text-xs"
              >
                {t.name} ({t._count.name})
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Active filter */}
      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Filtered by tag:</span>
          <Badge variant="secondary" className="gap-1">
            {tag}
            <Link href={search ? `/explore?q=${search}` : "/explore"}>
              <span className="hover:text-destructive ml-1">×</span>
            </Link>
          </Badge>
        </div>
      )}

      {/* Results */}
      {lists.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center">
          <p className="text-lg">No public lists found.</p>
          {(search || tag) && (
            <p className="mt-1 text-sm">Try a different search or filter.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                id={list.id}
                name={list.name}
                description={list.description}
                slug={list.slug}
                itemCount={list._count.items}
                likeCount={list._count.likes}
                posters={list.items.map((i) => i.posterPath)}
                author={list.user}
                tags={list.tags.map((t) => t.name)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/explore?${search ? `q=${search}&` : ""}${tag ? `tag=${tag}&` : ""}page=${page - 1}`}
                >
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/explore?${search ? `q=${search}&` : ""}${tag ? `tag=${tag}&` : ""}page=${page + 1}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
