/**
 * @module middleware
 * @description Edge middleware that handles authentication and request tracing.
 *
 * Responsibilities:
 * 1. Generates a unique `X-Request-ID` header for every request (tracing)
 * 2. Protects `/dashboard` routes via Clerk authentication
 * 3. Passes request ID through to API routes and server components
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Generate unique request ID for tracing across all components
  const requestId =
    req.headers.get("x-request-id") ?? crypto.randomUUID().slice(0, 8)

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Attach request ID to response headers for client-side correlation
  const response = NextResponse.next()
  response.headers.set("x-request-id", requestId)
  return response
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
