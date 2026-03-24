import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Веб-застосунок для створення та обміну списками фільмів | Бакалаврська робота",
  description:
    "Бакалаврська робота: веб-застосунок для створення та обміну списками фільмів з використанням TMDB API та AI-генерації персоналізованого контенту.",
  keywords: [
    "бакалаврська робота",
    "веб-застосунок",
    "списки фільмів",
    "TMDB API",
    "AI",
    "Next.js",
    "персоналізований контент",
  ],
  robots: { index: true, follow: true },
};

export default function ThesisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
