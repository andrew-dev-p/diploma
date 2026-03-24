"use client";

import Image from "next/image";
import Link from "next/link";
import { tmdbImageUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string;
  rating?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  compact?: boolean;
  hideLink?: boolean;
}

export function MovieCard({
  id,
  title,
  posterPath,
  year,
  rating,
  onAdd,
  onRemove,
  compact = false,
  hideLink = false,
}: MovieCardProps) {
  const imageUrl = tmdbImageUrl(posterPath, "w342");

  const card = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg",
        compact ? "flex gap-3" : "flex flex-col"
      )}
    >
      {/* Poster */}
      <div
        className={cn(
          "bg-muted relative overflow-hidden rounded-lg",
          compact ? "h-24 w-16 shrink-0" : "aspect-[2/3] w-full"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes={compact ? "64px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
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
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
          </div>
        )}

        {/* Rating badge */}
        {rating !== undefined && rating > 0 && !compact && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-xs font-semibold"
          >
            {rating.toFixed(1)}
          </Badge>
        )}

        {/* Action overlay */}
        {(onAdd || onRemove) && !compact && (
          <div className="absolute inset-0 flex items-end justify-center bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            {onAdd && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAdd();
                }}
              >
                + Add to List
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn("flex flex-col", compact ? "justify-center" : "mt-2")}>
        <h3
          className={cn(
            "font-medium leading-tight",
            compact ? "text-sm" : "text-sm line-clamp-2"
          )}
        >
          {title}
        </h3>
        {year && (
          <p className="text-muted-foreground mt-0.5 text-xs">{year}</p>
        )}
        {compact && rating !== undefined && rating > 0 && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {rating.toFixed(1)}
          </p>
        )}
      </div>

      {/* Compact action buttons */}
      {compact && onRemove && (
        <div className="ml-auto flex items-center">
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );

  if (hideLink) return card;

  return (
    <Link href={`/movies/${id}`} className="block">
      {card}
    </Link>
  );
}
