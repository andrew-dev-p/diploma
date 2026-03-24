"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { tmdbImageUrl } from "@/lib/tmdb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MovieSearch } from "@/components/movie-search"
import { ShareDialog } from "@/components/share-dialog"
import { AIGenerateButton } from "@/components/ai-generate-button"
import { AISuggestions } from "@/components/ai-suggestions"
import { TagEditor } from "@/components/tag-editor"
import {
  addMovieToList,
  removeMovieFromList,
  reorderListItems,
  updateList,
  deleteList,
  updateItemNotes,
} from "@/lib/actions/list-actions"
import { toast } from "sonner"

interface ListItem {
  id: string
  tmdbId: number
  title: string
  posterPath: string | null
  year: string | null
  notes: string | null
  order: number
}

interface ListEditorProps {
  list: {
    id: string
    name: string
    description: string | null
    aiDescription: string | null
    slug: string
    isPublic: boolean
    forkedFromSlug?: string | null
  }
  items: ListItem[]
  tags: string[]
}

function SortableItem({
  item,
  listId,
  onRemove,
}: {
  item: ListItem
  listId: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes ?? "")

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const posterUrl = tmdbImageUrl(item.posterPath, "w92")

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
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
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </button>

        {/* Poster */}
        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-muted">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="44px"
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

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.year}</p>
          {item.notes && !showNotes && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground italic">
              {item.notes}
            </p>
          )}
        </div>

        {/* Notes toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setShowNotes(!showNotes)}
          title="Add note"
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
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </Button>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>

      {/* Notes input */}
      {showNotes && (
        <div className="ml-10 flex gap-2">
          <Input
            placeholder="Add a note about this movie..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-xs"
            onBlur={async () => {
              try {
                await updateItemNotes(listId, item.id, notes.trim() || null)
              } catch {
                toast.error("Failed to save note")
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ;(e.target as HTMLInputElement).blur()
                setShowNotes(false)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

export function ListEditor({
  list,
  items: initialItems,
  tags,
}: ListEditorProps) {
  const router = useRouter()
  const [items, setItems] = useState<ListItem[]>(initialItems)
  const [name, setName] = useState(list.name)
  const [aiDescription, setAiDescription] = useState(list.aiDescription)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      const realItems = newItems.filter((i) => !i.id.startsWith("temp-"))
      if (realItems.length === 0) return

      try {
        await reorderListItems(
          list.id,
          realItems.map((i) => i.id)
        )
      } catch {
        toast.error("Failed to reorder")
        setItems(items)
      }
    },
    [items, list.id]
  )

  const handleAddMovie = useCallback(
    async (movie: {
      tmdbId: number
      title: string
      posterPath: string | null
      year: string
    }) => {
      const tempItem: ListItem = {
        id: `temp-${movie.tmdbId}`,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        year: movie.year,
        notes: null,
        order: items.length,
      }
      setItems((prev) => [...prev, tempItem])

      try {
        await addMovieToList(list.id, movie)
        router.refresh()
        toast.success(`Added "${movie.title}"`)
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== tempItem.id))
        toast.error("Failed to add movie")
      }
    },
    [list.id, items.length, router]
  )

  const handleRemove = useCallback(
    async (itemId: string) => {
      if (itemId.startsWith("temp-")) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
        return
      }

      const removed = items.find((i) => i.id === itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))

      try {
        await removeMovieFromList(list.id, itemId)
        toast.success("Movie removed")
      } catch {
        if (removed) setItems((prev) => [...prev, removed])
        toast.error("Failed to remove movie")
      }
    },
    [items, list.id]
  )

  const handleSaveName = useCallback(async () => {
    if (name.trim() === list.name) return
    setSaving(true)
    try {
      await updateList(list.id, { name: name.trim() })
      toast.success("List name updated")
    } catch {
      toast.error("Failed to update name")
      setName(list.name)
    } finally {
      setSaving(false)
    }
  }, [name, list.id, list.name])

  const handleTogglePublic = useCallback(
    async (isPublic: boolean) => {
      await updateList(list.id, { isPublic })
    },
    [list.id]
  )

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this list?")) return
    try {
      await deleteList(list.id)
      toast.success("List deleted")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to delete list")
    }
  }, [list.id, router])

  const handleAIGenerated = useCallback(
    async (description: string) => {
      setAiDescription(description)
      await updateList(list.id, { aiDescription: description })
    },
    [list.id]
  )

  return (
    <div className="space-y-6">
      {/* Forked from notice */}
      {list.forkedFromSlug && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
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
            className="text-muted-foreground"
          >
            <circle cx="12" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
            <path d="M12 12v3" />
          </svg>
          <span className="text-muted-foreground">
            Forked from{" "}
            <a
              href={`/lists/${list.forkedFromSlug}`}
              className="font-medium text-foreground hover:underline"
            >
              original list
            </a>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            className="border-transparent bg-transparent font-heading text-2xl font-bold focus:border-input focus:bg-background"
            disabled={saving}
          />
        </div>
        <div className="flex items-center gap-2">
          <AIGenerateButton
            listId={list.id}
            onGenerated={handleAIGenerated}
            disabled={items.length === 0}
          />
          <ShareDialog
            listId={list.id}
            slug={list.slug}
            isPublic={list.isPublic}
            onTogglePublic={handleTogglePublic}
          >
            <Button variant="outline" size="sm" className="gap-2">
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
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
              Share
            </Button>
          </ShareDialog>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tags */}
      <TagEditor listId={list.id} initialTags={tags} />

      {/* AI Description */}
      {aiDescription && (
        <div className="rounded-lg border bg-muted/50 p-4">
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
          <p className="text-sm text-muted-foreground italic">
            {aiDescription}
          </p>
        </div>
      )}

      <Separator />

      {/* Search to add movies */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Add Movies</h3>
        <MovieSearch
          onSelect={handleAddMovie}
          excludeIds={items.map((i) => i.tmdbId)}
        />
      </div>

      {/* AI Suggestions */}
      <AISuggestions
        listId={list.id}
        onAdd={handleAddMovie}
        disabled={items.length === 0}
      />

      <Separator />

      {/* Movie list */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Movies ({items.length})</h3>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Search and add movies to your list above.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    listId={list.id}
                    onRemove={() => handleRemove(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
