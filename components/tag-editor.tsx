"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { updateListTags } from "@/lib/actions/list-actions"
import { toast } from "sonner"

export function TagEditor({
  listId,
  initialTags,
}: {
  listId: string
  initialTags: string[]
}) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState("")
  const [isPending, startTransition] = useTransition()

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase()
    if (!normalized || tags.includes(normalized) || tags.length >= 10) return
    const newTags = [...tags, normalized]
    setTags(newTags)
    setInput("")
    startTransition(async () => {
      try {
        await updateListTags(listId, newTags)
      } catch {
        setTags(tags)
        toast.error("Failed to update tags")
      }
    })
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    startTransition(async () => {
      try {
        await updateListTags(listId, newTags)
      } catch {
        setTags(tags)
        toast.error("Failed to update tags")
      }
    })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tags</label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              className="ml-0.5 hover:text-destructive"
              onClick={() => removeTag(tag)}
              disabled={isPending}
            >
              ×
            </button>
          </Badge>
        ))}
        {tags.length < 10 && (
          <Input
            placeholder="Add tag..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag(input)
              }
              if (e.key === ",") {
                e.preventDefault()
                addTag(input)
              }
            }}
            onBlur={() => {
              if (input.trim()) addTag(input)
            }}
            className="h-7 w-24 text-xs"
            disabled={isPending}
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Press Enter to add. Max 10 tags.
      </p>
    </div>
  )
}
