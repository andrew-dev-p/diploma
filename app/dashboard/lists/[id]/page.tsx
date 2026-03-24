import { notFound, redirect } from "next/navigation";
import { syncUser } from "@/lib/user-sync";
import { db } from "@/lib/db";
import { ListEditor } from "@/components/list-editor";

export default async function EditListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const list = await db.movieList.findUnique({
    where: { id, userId: user.id },
    include: {
      items: { orderBy: { order: "asc" } },
      tags: { select: { name: true } },
      forkedFrom: { select: { slug: true } },
    },
  });

  if (!list) notFound();

  return (
    <ListEditor
      list={{
        id: list.id,
        name: list.name,
        description: list.description,
        aiDescription: list.aiDescription,
        slug: list.slug,
        isPublic: list.isPublic,
        forkedFromSlug: list.forkedFrom?.slug ?? null,
      }}
      items={list.items.map((item) => ({
        id: item.id,
        tmdbId: item.tmdbId,
        title: item.title,
        posterPath: item.posterPath,
        year: item.year,
        notes: item.notes,
        order: item.order,
      }))}
      tags={list.tags.map((t) => t.name)}
    />
  );
}
