"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { tmdbImageUrl, type TMDBMovie } from "@/lib/tmdb"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MovieSearchProps {
  onSelect: (movie: {
    tmdbId: number
    title: string
    posterPath: string | null
    year: string
  }) => void
  excludeIds?: number[]
  placeholder?: string
}

export function MovieSearch({
  onSelect,
  excludeIds = [],
  placeholder = "Search for a movie...",
}: MovieSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredResults = results.filter((m) => !excludeIds.includes(m.id))
  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true)
        }}
      />

      {showDropdown && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-1">
                    <Skeleton className="h-12 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredResults.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No movies found.
              </p>
            )}

            {!loading &&
              filteredResults.slice(0, 8).map((movie) => {
                const posterUrl = tmdbImageUrl(movie.poster_path, "w92")
                const year = movie.release_date?.split("-")[0] ?? ""
                return (
                  <button
                    key={movie.id}
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                    )}
                    onClick={() => {
                      onSelect({
                        tmdbId: movie.id,
                        title: movie.title,
                        posterPath: movie.poster_path,
                        year,
                      })
                      setQuery("")
                      setResults([])
                      setOpen(false)
                    }}
                  >
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={movie.title}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-muted-foreground/50"
                          >
                            <rect x="2" y="6" width="14" height="12" rx="2" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {movie.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{year}</p>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
