import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return user;
}
