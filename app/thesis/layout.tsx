import type { Metadata } from "next"

const title =
  "Веб-застосунок для створення та обміну списками фільмів | Бакалаврська робота"
const description =
  "Бакалаврська робота: розробка веб-застосунку CineList для створення та обміну списками фільмів з використанням TMDB API та AI-генерації персоналізованого контенту."
const url = "https://cinelist.vercel.app/thesis"

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "бакалаврська робота",
    "веб-застосунок",
    "списки фільмів",
    "TMDB API",
    "штучний інтелект",
    "Next.js",
    "персоналізований контент",
    "CineList",
    "Google Gemini",
    "Clerk",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url,
    siteName: "CineList",
    locale: "uk_UA",
    type: "article",
    authors: ["Попов Андрій"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: url,
    languages: {
      uk: url,
      en: `${url}?lang=en`,
    },
  },
}

export default function ThesisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
