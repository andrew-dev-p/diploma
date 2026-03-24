import Script from "next/script";

const sections = [
  { id: "about", label: "Про роботу" },
  { id: "relevance", label: "Актуальність" },
  { id: "goals", label: "Мета та завдання" },
  { id: "methodology", label: "Методологія" },
  { id: "results", label: "Результати" },
  { id: "contact", label: "Контакти" },
] as const;

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  name: "Веб-застосунок для створення та обміну списками фільмів з використанням TMDB API та AI-генерації персоналізованого контенту",
  alternativeHeadline:
    "Web Application for Creating and Sharing Movie Lists Using TMDB API and AI-Generated Personalized Content",
  author: {
    "@type": "Person",
    name: "Попов Андрій",
  },
  educationalLevel: "Bachelor",
  inLanguage: ["uk", "en"],
  keywords:
    "веб-застосунок, списки фільмів, TMDB API, AI, Next.js, персоналізований контент",
  about: {
    "@type": "SoftwareApplication",
    name: "CineList",
    applicationCategory: "Entertainment",
    operatingSystem: "Web",
  },
};

export default function ThesisPage() {
  return (
    <>
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Перейти до основного вмісту
        </a>

        {/* Navigation */}
        <nav aria-label="Навігація сторінкою бакалаврської роботи">
          <ul role="list">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-label={`Перейти до секції: ${s.label}`}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hero */}
        <header id="hero" role="banner">
          <h1 lang="uk">
            Веб-застосунок для створення та обміну списками фільмів з
            використанням TMDB API та AI-генерації персоналізованого контенту
          </h1>
          <p lang="en" aria-label="Thesis title in English">
            Web Application for Creating and Sharing Movie Lists Using TMDB API
            and AI-Generated Personalized Content
          </p>
          <p>Попов Андрій</p>
          <p>Бакалаврська робота</p>
        </header>

        <main id="main-content" role="main">
          {/* About */}
          <section id="about" aria-labelledby="about-heading">
            <h2 id="about-heading">Про роботу</h2>
            <p>Короткий опис</p>
            <p>Ключові слова</p>
          </section>

          {/* Relevance */}
          <section id="relevance" aria-labelledby="relevance-heading">
            <h2 id="relevance-heading">Актуальність теми</h2>
            <p>Зміст буде додано.</p>
          </section>

          {/* Goals */}
          <section id="goals" aria-labelledby="goals-heading">
            <h2 id="goals-heading">Мета та завдання</h2>
            <h3>Мета дослідження</h3>
            <p>Зміст буде додано.</p>
            <h3>Основні завдання</h3>
            <ol aria-label="Список основних завдань дослідження">
              <li>Завдання 1</li>
              <li>Завдання 2</li>
              <li>Завдання 3</li>
              <li>Завдання 4</li>
              <li>Завдання 5</li>
            </ol>
          </section>

          {/* Methodology */}
          <section id="methodology" aria-labelledby="methodology-heading">
            <h2 id="methodology-heading">Методологія дослідження</h2>
            <p>Зміст буде додано.</p>
          </section>

          {/* Results */}
          <section id="results" aria-labelledby="results-heading">
            <h2 id="results-heading">Очікувані результати</h2>
            <p>Зміст буде додано.</p>
          </section>
        </main>

        {/* Contact */}
        <footer id="contact" role="contentinfo" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Контакти</h2>
          <address>
            <p>Попов Андрій</p>
          </address>
        </footer>
      </div>
    </>
  );
}
