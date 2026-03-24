"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  toggleWatchlist,
  markAsWatched,
  rateMovie,
  removeRating,
} from "@/lib/actions/movie-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Watchlist Button ────────────────────────────────────────

export function WatchlistButton({
  movie,
  initialInWatchlist,
}: {
  movie: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    year: string;
  };
  initialInWatchlist: boolean;
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [isPending, startTransition] = useTransition();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={inWatchlist ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const result = await toggleWatchlist(movie);
                  setInWatchlist(result);
                  toast.success(
                    result ? "Added to watchlist" : "Removed from watchlist"
                  );
                } catch {
                  toast.error("Failed to update watchlist");
                }
              });
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={inWatchlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            {inWatchlist ? "In Watchlist" : "Watchlist"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Mark Watched Button ─────────────────────────────────────

export function MarkWatchedButton({
  movie,
  initialWatched,
}: {
  movie: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    year: string;
    runtime?: number;
    genreIds?: number[];
  };
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useState(initialWatched);
  const [isPending, startTransition] = useTransition();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={watched ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await markAsWatched(movie);
                  setWatched(true);
                  toast.success("Marked as watched");
                } catch {
                  toast.error("Failed to mark as watched");
                }
              });
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
              {watched ? (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              ) : (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
            {watched ? "Watched" : "Mark Watched"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {watched ? "You've watched this" : "Mark as watched"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Star Rating ─────────────────────────────────────────────

export function StarRating({
  tmdbId,
  initialRating,
}: {
  tmdbId: number;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayRating = hovered ?? rating ?? 0;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">
        {rating ? `Your rating: ${rating}/10` : "Rate this movie"}
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            disabled={isPending}
            className={cn(
              "transition-colors hover:scale-110",
              isPending && "opacity-50"
            )}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              startTransition(async () => {
                try {
                  if (rating === star) {
                    await removeRating(tmdbId);
                    setRating(null);
                    toast.success("Rating removed");
                  } else {
                    await rateMovie(tmdbId, star);
                    setRating(star);
                    toast.success(`Rated ${star}/10`);
                  }
                } catch {
                  toast.error("Failed to rate");
                }
              });
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={star <= displayRating ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              className={cn(
                "transition-colors",
                star <= displayRating
                  ? "text-yellow-500"
                  : "text-muted-foreground/30"
              )}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
