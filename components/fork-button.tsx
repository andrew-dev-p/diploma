"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { forkList } from "@/lib/actions/list-actions";
import { toast } from "sonner";

export function ForkButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            const result = await forkList(listId);
            toast.success("List forked! Redirecting to your copy...");
            router.push(`/dashboard/lists/${result.id}`);
          } catch {
            toast.error("Failed to fork list");
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
        <circle cx="12" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
        <path d="M12 12v3" />
      </svg>
      {isPending ? "Forking..." : "Fork List"}
    </Button>
  );
}
