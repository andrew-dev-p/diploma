/**
 * @module ai
 *
 * AI service layer for generating movie-related content using Google Gemini.
 *
 * All exported functions in this module call the **Gemini 2.0 Flash** model
 * via the `@google/genai` SDK. Functions that expect structured data instruct
 * the model to return JSON and parse the response, falling back to empty
 * arrays or `null` when parsing fails.
 *
 * @remarks
 * Requires the `GEMINI_API_KEY` environment variable to be set.
 */

import { GoogleGenAI } from "@google/genai"
import { createModuleLogger } from "@/lib/logger"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const log = createModuleLogger("ai")

/**
 * Generates a short, engaging description for a user-created movie list.
 *
 * Sends the list name and its movies to Gemini and asks for a 2-3 sentence
 * description that captures the theme or mood connecting the films.
 *
 * @param listName - The human-readable name of the movie list.
 * @param movies - Array of movies currently in the list.
 * @param movies[].title - The title of the movie.
 * @param movies[].year - The release year of the movie.
 * @returns A plain-text description string, or `null` if the model returns no text.
 * @throws Will propagate any network or API errors from the Gemini SDK.
 *
 * @example
 * ```ts
 * const desc = await generateListDescription("Sci-Fi Classics", [
 *   { title: "Blade Runner", year: "1982" },
 *   { title: "2001: A Space Odyssey", year: "1968" },
 * ]);
 * // => "A journey through cinema's most visionary futures..."
 * ```
 */
export async function generateListDescription(
  listName: string,
  movies: { title: string; year: string }[]
) {
  log.info({ listName, movieCount: movies.length }, "Generating list description")
  const movieTitles = movies.map((m) => `${m.title} (${m.year})`).join(", ")

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Write a short, engaging description (2-3 sentences) for a movie list called "${listName}" containing these movies: ${movieTitles}. The description should capture the theme or mood that connects these films. Write in a warm, cinephile-friendly tone. Do not use markdown formatting.`,
    })

    log.info({ listName, hasResult: !!response.text }, "List description generated")
    return response.text ?? null
  } catch (err) {
    log.error({ err, listName }, "Failed to generate list description")
    return null
  }
}

/**
 * Generates movie recommendations based on an existing collection of movies.
 *
 * Asks Gemini to suggest 5 similar movies that the viewer might enjoy.
 * The response is expected as a JSON array and is parsed accordingly.
 *
 * @param movies - Array of movies to base recommendations on.
 * @param movies[].title - The title of the movie.
 * @param movies[].year - The release year of the movie.
 * @returns A parsed array of recommended movies with `title` and `year`,
 *          or an empty array if the model response cannot be parsed.
 * @throws Will propagate any network or API errors from the Gemini SDK.
 *
 * @example
 * ```ts
 * const recs = await generateRecommendations([
 *   { title: "The Matrix", year: "1999" },
 *   { title: "Inception", year: "2010" },
 * ]);
 * // => [{ title: "Dark City", year: "1998" }, ...]
 * ```
 */
export async function generateRecommendations(
  movies: { title: string; year: string }[]
) {
  const movieTitles = movies.map((m) => `${m.title} (${m.year})`).join(", ")

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Based on this list of movies: ${movieTitles}, recommend 5 similar movies the viewer might enjoy. For each recommendation, provide the exact movie title and release year in this JSON format: [{"title": "Movie Title", "year": "2024"}]. Only return the JSON array, nothing else.`,
  })

  const text = response.text
  if (text) {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleaned) as { title: string; year: string }[]
    } catch {
      return []
    }
  }
  return []
}

/**
 * Generates a trending-movies banner with a witty headline and an editor's pick.
 *
 * Takes up to 5 trending movies (sliced internally), sends their metadata to
 * Gemini, and receives a JSON object containing a punchy headline, a
 * recommended pick title, and a reason to watch it.
 *
 * @param trendingMovies - Array of currently trending movies.
 * @param trendingMovies[].title - The title of the movie.
 * @param trendingMovies[].year - The release year of the movie.
 * @param trendingMovies[].overview - A brief synopsis of the movie (first 100 chars used).
 * @returns A parsed object with `headline`, `pickTitle`, and `pickReason`,
 *          or `null` if the model response cannot be parsed.
 * @throws Will propagate any network or API errors from the Gemini SDK.
 *
 * @example
 * ```ts
 * const banner = await generateTrendingBanner([
 *   { title: "Dune: Part Two", year: "2024", overview: "Paul Atreides unites with the Fremen..." },
 * ]);
 * // => { headline: "Sci-fi epics dominate...", pickTitle: "Dune: Part Two", pickReason: "..." }
 * ```
 */
export async function generateTrendingBanner(
  trendingMovies: { title: string; year: string; overview: string }[]
) {
  const moviesInfo = trendingMovies
    .slice(0, 5)
    .map((m) => `${m.title} (${m.year}): ${m.overview.slice(0, 100)}`)
    .join("\n")

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a witty film critic. Based on what's trending this week in cinema:

${moviesInfo}

Write a very short, punchy insight (1-2 sentences max, under 150 characters total) about what's trending right now. Be clever and engaging, like a film-savvy friend. Also pick the single most interesting movie from the list and explain in one short sentence why someone should watch it.

Return ONLY this JSON (no markdown):
{"headline": "your short trending insight", "pickTitle": "Movie Title", "pickReason": "why watch it (1 sentence)"}`,
  })

  const text = response.text
  if (text) {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleaned) as {
        headline: string
        pickTitle: string
        pickReason: string
      }
    } catch {
      return null
    }
  }
  return null
}

/**
 * Suggests movies that would complement an existing movie list.
 *
 * Considers the list name, optional description, and current movies to
 * suggest 3 additions that fit the list's theme. Each suggestion includes
 * a brief reason explaining why it belongs.
 *
 * @param listName - The human-readable name of the movie list.
 * @param listDescription - An optional description of the list (may be `null`).
 * @param existingMovies - Array of movies already in the list.
 * @param existingMovies[].title - The title of the movie.
 * @param existingMovies[].year - The release year of the movie.
 * @returns A parsed array of suggestions, each with `title`, `year`, and `reason`,
 *          or an empty array if the model response cannot be parsed.
 * @throws Will propagate any network or API errors from the Gemini SDK.
 *
 * @example
 * ```ts
 * const suggestions = await generateListSuggestions(
 *   "Feel-Good Comedies",
 *   "Movies that always make you smile",
 *   [{ title: "The Grand Budapest Hotel", year: "2014" }]
 * );
 * // => [{ title: "Amélie", year: "2001", reason: "Whimsical and heartwarming" }, ...]
 * ```
 */
export async function generateListSuggestions(
  listName: string,
  listDescription: string | null,
  existingMovies: { title: string; year: string }[]
) {
  const movieTitles = existingMovies
    .map((m) => `${m.title} (${m.year})`)
    .join(", ")

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `A user has a movie list called "${listName}"${listDescription ? ` described as: "${listDescription}"` : ""}. It currently contains: ${movieTitles || "no movies yet"}.

Suggest 3 movies that would perfectly complement this list. Consider the theme, mood, and pattern of the existing movies. If the list is empty, base suggestions on the list name/description.

Return ONLY this JSON array (no markdown):
[{"title": "Movie Title", "year": "2024", "reason": "very short reason why it fits (under 10 words)"}]`,
  })

  const text = response.text
  if (text) {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleaned) as {
        title: string
        year: string
        reason: string
      }[]
    } catch {
      return []
    }
  }
  return []
}
