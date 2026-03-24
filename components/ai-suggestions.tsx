"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { tmdbImageUrl } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string;
  rating: number;
  reason: string;
}

export function AISuggestions({
  listId,
  onAdd,
  disabled,
}: {
  listId: string;
  onAdd: (movie: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    year: string;
  }) => void;
  disabled?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/list-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.suggestions);
      setVisible(true);
    } catch {
      toast.error("Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  }, [listId]);

  if (!visible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={fetchSuggestions}
        disabled={loading || disabled}
      >
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
          className={cn("text-primary", loading && "animate-spin")}
        >
          {loading ? (
            <>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </>
          ) : (
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          )}
        </svg>
        {loading ? "Thinking..." : "AI Suggestions"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          <span className="text-xs font-medium">AI Suggests</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setVisible(false)}
          >
            Hide
          </Button>
        </div>
      </div>
      {suggestions.map((s) => {
        const posterUrl = tmdbImageUrl(s.posterPath, "w92");
        return (
          <div
            key={s.tmdbId}
            className="bg-primary/5 border-primary/20 animate-in fade-in flex items-center gap-3 rounded-lg border border-dashed p-3"
          >
            <div className="bg-muted relative h-14 w-10 shrink-0 overflow-hidden rounded">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={s.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs">
                  ?
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              <p className="text-muted-foreground text-xs">
                {s.year} · {s.reason}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 shrink-0 text-xs"
              onClick={() => {
                onAdd({
                  tmdbId: s.tmdbId,
                  title: s.title,
                  posterPath: s.posterPath,
                  year: s.year,
                });
                setSuggestions((prev) =>
                  prev.filter((p) => p.tmdbId !== s.tmdbId)
                );
              }}
            >
              + Add
            </Button>
          </div>
        );
      })}
    </div>
  );
}
