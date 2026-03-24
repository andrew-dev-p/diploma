/**
 * @module db
 * @description Prisma client singleton for database access.
 *
 * Uses the singleton pattern to prevent multiple Prisma Client instances
 * during development hot reloading. In production, a single instance is
 * created per process. Connects to Neon PostgreSQL via the `@prisma/adapter-pg` driver.
 *
 * @example
 * ```ts
 * import { db } from "@/lib/db"
 * const users = await db.user.findMany()
 * ```
 */

import "dotenv/config"
import { PrismaClient } from "../prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates a new PrismaClient instance with the Neon PostgreSQL adapter.
 * @returns A configured PrismaClient connected to the DATABASE_URL
 */
function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({ adapter })
}

/**
 * Shared Prisma client instance.
 * Reused across hot reloads in development via `globalForPrisma`.
 */
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
