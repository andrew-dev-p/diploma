"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { tmdbImageUrl } from "@/lib/tmdb";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BannerData {
  headline: string;
  pick: {
    id: number;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    year: string;
    rating: number;
    reason: string;
  } | null;
}

export function AITrendingBanner() {
  const [data, setData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/ai/trending-banner")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error || (!loading && !data)) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-card flex items-center gap-4 overflow-hidden rounded-xl border p-4">
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-20 w-14 shrink-0 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const posterUrl = data.pick?.posterPath
    ? tmdbImageUrl(data.pick.posterPath, "w154")
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-card group relative overflow-hidden rounded-xl border">
        <div className="flex items-center gap-4 p-4">
          {/* AI icon */}
          <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
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
              className="text-primary"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                AI Pick
              </Badge>
              <span className="text-muted-foreground text-[10px]">
                Trending this week
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{data.headline}</p>
            {data.pick && (
              <p className="text-muted-foreground mt-0.5 text-xs">
                <span className="text-foreground font-medium">
                  {data.pick.title}
                </span>{" "}
                — {data.pick.reason}
              </p>
            )}
          </div>

          {/* Movie poster */}
          {data.pick && posterUrl && (
            <Link
              href={`/movies/${data.pick.id}`}
              className="shrink-0 transition-transform hover:scale-105"
            >
              <div className="bg-muted relative h-20 w-14 overflow-hidden rounded-lg shadow-sm">
                <Image
                  src={posterUrl}
                  alt={data.pick.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
