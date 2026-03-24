"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ShareDialogProps {
  listId: string;
  slug: string;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => Promise<void>;
  children: React.ReactNode;
}

export function ShareDialog({
  slug,
  isPublic,
  onTogglePublic,
  children,
}: ShareDialogProps) {
  const [publicState, setPublicState] = useState(isPublic);
  const [toggling, setToggling] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lists/${slug}`
      : `/lists/${slug}`;

  async function handleToggle(checked: boolean) {
    setToggling(true);
    try {
      await onTogglePublic(checked);
      setPublicState(checked);
      toast.success(checked ? "List is now public" : "List is now private");
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setToggling(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share List</DialogTitle>
          <DialogDescription>
            Make your list public so others can discover and like it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public</p>
              <p className="text-muted-foreground text-xs">
                Anyone with the link can view this list
              </p>
            </div>
            <Switch
              checked={publicState}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          </div>

          {/* Share link */}
          {publicState && (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-sm" />
              <Button
                variant="secondary"
                size="sm"
                onClick={copyLink}
                className="shrink-0"
              >
                Copy
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
