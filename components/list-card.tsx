import Image from "next/image";
import Link from "next/link";
import { tmdbImageUrl } from "@/lib/tmdb";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ListCardProps {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  itemCount: number;
  likeCount: number;
  posters: (string | null)[];
  author?: {
    username: string | null;
    imageUrl: string | null;
  };
  href?: string;
  tags?: string[];
}

export function ListCard({
  name,
  description,
  slug,
  itemCount,
  likeCount,
  posters,
  author,
  href,
  tags,
}: ListCardProps) {
  const linkHref = href ?? `/lists/${slug}`;

  return (
    <Link href={linkHref} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        {/* Poster mosaic */}
        <div className="bg-muted relative grid h-40 grid-cols-4 gap-0.5 overflow-hidden">
          {[0, 1, 2, 3].map((i) => {
            const posterUrl = posters[i]
              ? tmdbImageUrl(posters[i], "w185")
              : null;
            return (
              <div key={i} className="relative overflow-hidden">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                ) : (
                  <div className="bg-muted flex h-full items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-muted-foreground/40"
                    >
                      <rect x="2" y="6" width="14" height="12" rx="2" />
                      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <CardContent className="p-4">
          <h3 className="font-heading text-lg font-semibold leading-tight line-clamp-1">
            {name}
          </h3>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
              {description}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between px-4 pb-4 pt-0">
          {/* Author */}
          {author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={author.imageUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(author.username ?? "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
                {author.username ?? "User"}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>{itemCount} films</span>
            {likeCount > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {likeCount}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
