"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DiscoverFiltersProps {
  genres: { id: number; name: string }[];
  currentGenre?: string;
  currentYearFrom?: string;
  currentYearTo?: string;
  currentRatingMin?: string;
  currentSort?: string;
}

const sortOptions = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "primary_release_date.asc", label: "Oldest" },
  { value: "revenue.desc", label: "Highest Revenue" },
];

export function DiscoverFilters({
  genres,
  currentGenre,
  currentYearFrom,
  currentYearTo,
  currentRatingMin,
  currentSort,
}: DiscoverFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset to page 1
      router.push(`/discover?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/discover");
  }, [router]);

  const hasFilters = currentGenre || currentYearFrom || currentYearTo || currentRatingMin;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Genre */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Genre</label>
          <Select
            value={currentGenre ?? "all"}
            onValueChange={(v) => updateFilter("genre", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year range */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Year From</label>
          <Input
            type="number"
            min="1900"
            max="2026"
            placeholder="1900"
            className="w-[100px]"
            defaultValue={currentYearFrom ?? ""}
            onBlur={(e) => updateFilter("year_from", e.target.value || undefined)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("year_from", (e.target as HTMLInputElement).value || undefined);
              }
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Year To</label>
          <Input
            type="number"
            min="1900"
            max="2026"
            placeholder="2026"
            className="w-[100px]"
            defaultValue={currentYearTo ?? ""}
            onBlur={(e) => updateFilter("year_to", e.target.value || undefined)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("year_to", (e.target as HTMLInputElement).value || undefined);
              }
            }}
          />
        </div>

        {/* Min rating */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Min Rating</label>
          <Select
            value={currentRatingMin ?? "all"}
            onValueChange={(v) => updateFilter("rating_min", v)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="9">9+</SelectItem>
              <SelectItem value="8">8+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
              <SelectItem value="6">6+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium">Sort By</label>
          <Select
            value={currentSort ?? "popularity.desc"}
            onValueChange={(v) => updateFilter("sort", v)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {currentGenre && (
            <Badge variant="secondary" className="gap-1">
              {genres.find((g) => String(g.id) === currentGenre)?.name}
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => updateFilter("genre", undefined)}
              >
                ×
              </button>
            </Badge>
          )}
          {currentYearFrom && (
            <Badge variant="secondary" className="gap-1">
              From {currentYearFrom}
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => updateFilter("year_from", undefined)}
              >
                ×
              </button>
            </Badge>
          )}
          {currentYearTo && (
            <Badge variant="secondary" className="gap-1">
              To {currentYearTo}
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => updateFilter("year_to", undefined)}
              >
                ×
              </button>
            </Badge>
          )}
          {currentRatingMin && (
            <Badge variant="secondary" className="gap-1">
              Rating {currentRatingMin}+
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => updateFilter("rating_min", undefined)}
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
