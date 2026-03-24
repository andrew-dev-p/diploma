"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createList } from "@/lib/actions/list-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      if (!name.trim()) {
        toast.error("Please enter a list name");
        setLoading(false);
        return;
      }

      const result = await createList(formData);
      toast.success("List created!");
      router.push(`/dashboard/lists/${result.id}`);
    } catch {
      toast.error("Failed to create list");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            Create New List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                List Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="My Favorite Movies"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="A short description of your list..."
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create List"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
