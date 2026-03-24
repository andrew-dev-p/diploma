import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function generateListDescription(
  listName: string,
  movies: { title: string; year: string }[]
) {
  const movieTitles = movies.map((m) => `${m.title} (${m.year})`).join(", ")

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Write a short, engaging description (2-3 sentences) for a movie list called "${listName}" containing these movies: ${movieTitles}. The description should capture the theme or mood that connects these films. Write in a warm, cinephile-friendly tone. Do not use markdown formatting.`,
  })

  return response.text ?? null
}

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
