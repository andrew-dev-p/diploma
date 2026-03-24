"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createListFromTemplate } from "@/lib/actions/list-actions";
import { toast } from "sonner";

const templates = [
  {
    id: "top-10",
    name: "Top 10 of [Year]",
    description: "Rank your favorite films from a specific year",
    icon: "🏆",
    defaultName: `Top 10 of ${new Date().getFullYear()}`,
  },
  {
    id: "director-spotlight",
    name: "Director Spotlight",
    description: "Celebrate the filmography of your favorite director",
    icon: "🎬",
    defaultName: "Director Spotlight",
  },
  {
    id: "genre-deep-dive",
    name: "Genre Deep Dive",
    description: "Curate the best of a specific genre",
    icon: "🎭",
    defaultName: "Genre Deep Dive",
  },
  {
    id: "movie-marathon",
    name: "Movie Marathon",
    description: "Plan a binge session in the perfect watching order",
    icon: "🍿",
    defaultName: "Movie Marathon",
  },
];

export function ListTemplates() {
  const router = useRouter();
  const [selected, setSelected] = useState<(typeof templates)[0] | null>(null);
  const [listName, setListName] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!selected || !listName.trim()) return;
    startTransition(async () => {
      try {
        const result = await createListFromTemplate(selected.id, listName.trim());
        toast.success("List created from template!");
        setOpen(false);
        router.push(`/dashboard/lists/${result.id}`);
      } catch {
        toast.error("Failed to create list");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
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
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          From Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected?.id === t.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
              onClick={() => {
                setSelected(t);
                setListName(t.defaultName);
              }}
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.description}</p>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">List Name</label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={isPending || !listName.trim()}
            >
              {isPending ? "Creating..." : "Create List"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
