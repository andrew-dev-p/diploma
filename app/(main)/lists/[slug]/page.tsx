import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tmdbImageUrl } from "@/lib/tmdb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LikeButton } from "@/components/like-button";
import { ForkButton } from "@/components/fork-button";
import { ListComments } from "@/components/list-comments";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = await db.movieList.findUnique({
    where: { slug, isPublic: true },
    select: { name: true, description: true, aiDescription: true },
  });

  if (!list) return { title: "List Not Found" };

  return {
    title: `${list.name} — CineList`,
    description:
      list.aiDescription ||
      list.description ||
      `A curated movie list on CineList`,
  };
}

export default async function PublicListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const list = await db.movieList.findUnique({
    where: { slug, isPublic: true },
    include: {
      user: { select: { id: true, username: true, imageUrl: true } },
      items: { orderBy: { order: "asc" } },
      tags: { select: { name: true } },
      _count: { select: { likes: true, forks: true } },
      forkedFrom: {
        select: { slug: true, name: true, user: { select: { username: true } } },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, username: true, imageUrl: true } },
          replies: {
            include: {
              user: { select: { id: true, username: true, imageUrl: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!list) notFound();

  // Check if current user has liked this list
  let hasLiked = false;
  let currentUserId: string | null = null;
  const { userId: clerkId } = await auth();
  if (clerkId) {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (dbUser) {
      currentUserId = dbUser.id;
      const like = await db.listLike.findUnique({
        where: { userId_listId: { userId: dbUser.id, listId: list.id } },
      });
      hasLiked = !!like;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Forked from */}
      {list.forkedFrom && (
        <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
            <path d="M12 12v3" />
          </svg>
          Forked from{" "}
          <Link
            href={`/lists/${list.forkedFrom.slug}`}
            className="text-foreground font-medium hover:underline"
          >
            {list.forkedFrom.name}
          </Link>
          {list.forkedFrom.user?.username && (
            <span>by {list.forkedFrom.user.username}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {list.name}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={list.user.imageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(list.user.username ?? "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-sm">
                  {list.user.username ?? "User"}
                </span>
              </div>
              <Badge variant="secondary">{list.items.length} films</Badge>
              {list._count.forks > 0 && (
                <Badge variant="outline">{list._count.forks} forks</Badge>
              )}
            </div>

            {/* Tags */}
            {list.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {list.tags.map((tag) => (
                  <Link key={tag.name} href={`/explore?tag=${tag.name}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-accent"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {clerkId && list.user.id !== currentUserId && (
              <ForkButton listId={list.id} />
            )}
            {clerkId && (
              <LikeButton
                listId={list.id}
                initialLiked={hasLiked}
                initialCount={list._count.likes}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Description */}
      {list.aiDescription && (
        <div className="bg-muted/50 mb-6 rounded-lg border p-4">
          <div className="mb-1 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            <span className="text-xs font-medium">
              AI-generated description
            </span>
          </div>
          <p className="text-muted-foreground text-sm italic">
            {list.aiDescription}
          </p>
        </div>
      )}

      {/* User Description */}
      {list.description && (
        <p className="text-muted-foreground mb-6">{list.description}</p>
      )}

      <Separator className="mb-8" />

      {/* Movie Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.items.map((item) => {
          const posterUrl = tmdbImageUrl(item.posterPath, "w342");
          return (
            <Link
              key={item.id}
              href={`/movies/${item.tmdbId}`}
              className="group"
            >
              <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-lg">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-muted-foreground"
                    >
                      <rect x="2" y="6" width="14" height="12" rx="2" />
                      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium leading-tight line-clamp-2">
                  {item.title}
                </p>
                <p className="text-muted-foreground text-xs">{item.year}</p>
                {item.notes && (
                  <p className="text-muted-foreground mt-0.5 text-[11px] italic line-clamp-2">
                    {item.notes}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Comments */}
      <Separator className="my-8" />
      <ListComments
        listId={list.id}
        comments={list.comments}
        currentUserId={currentUserId}
        isSignedIn={!!clerkId}
      />
    </div>
  );
}
