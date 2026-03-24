import Script from "next/script";
import Image from "next/image";

const sections = [
  { id: "about", label: "Про роботу" },
  { id: "relevance", label: "Актуальність" },
  { id: "goals", label: "Мета та завдання" },
  { id: "methodology", label: "Методологія" },
  { id: "results", label: "Результати" },
  { id: "tech", label: "Технології" },
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
    email: "andriipopov.dev@gmail.com",
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
    url: "https://cinelist.vercel.app",
  },
};

const keywords = [
  "Next.js",
  "React",
  "TypeScript",
  "TMDB API",
  "Google Gemini",
  "Prisma",
  "PostgreSQL",
  "Clerk Auth",
  "shadcn/ui",
  "Tailwind CSS",
];

const tasks = [
  "Провести аналіз існуючих платформ для створення списків фільмів та виявити їх обмеження",
  "Спроєктувати архітектуру веб-застосунку з використанням сучасних технологій (Next.js, Prisma, PostgreSQL)",
  "Реалізувати інтеграцію з TMDB API для отримання повної інформації про фільми, акторів та режисерів",
  "Розробити систему AI-генерації персоналізованого контенту на основі Google Gemini для опису списків та рекомендацій",
  "Забезпечити функціонал обміну списками, коментування, оцінювання та форкінгу списків між користувачами",
];

const techStack = [
  {
    category: "Frontend",
    items: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS 4", "shadcn/ui", "Radix UI"],
  },
  {
    category: "Backend",
    items: ["Next.js Server Actions", "Next.js API Routes", "Prisma 7 ORM"],
  },
  {
    category: "Бази даних",
    items: ["PostgreSQL (Neon)", "Prisma Migrations"],
  },
  {
    category: "Зовнішні API",
    items: ["TMDB API (фільми, актори, жанри)", "Google Gemini (AI-генерація)"],
  },
  {
    category: "Аутентифікація",
    items: ["Clerk (Google OAuth)"],
  },
];

export default function ThesisPage() {
  return (
    <>
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Skip to content */}
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
                <a
                  href={`#${s.id}`}
                  aria-label={`Перейти до секції: ${s.label}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hero */}
        <header id="hero" role="banner">
          {/* University logo placeholder */}
          <div aria-label="Логотип університету">
            <Image
              src="/university-logo.svg"
              alt="Логотип Національного технічного університету України «Київський політехнічний інститут імені Ігоря Сікорського»"
              width={120}
              height={120}
              priority
            />
          </div>

          <h1 lang="uk">
            Веб-застосунок для створення та обміну списками фільмів з
            використанням TMDB API та AI-генерації персоналізованого контенту
          </h1>

          <p lang="en" aria-label="Thesis title in English">
            Web Application for Creating and Sharing Movie Lists Using TMDB API
            and AI-Generated Personalized Content
          </p>

          <p>
            <strong>Автор:</strong> Попов Андрій
          </p>
          <p>Бакалаврська робота</p>
        </header>

        <main id="main-content" role="main">
          {/* About */}
          <section id="about" aria-labelledby="about-heading">
            <h2 id="about-heading">Про роботу</h2>

            <p>
              CineList — це веб-застосунок, який дозволяє користувачам створювати
              персоналізовані списки фільмів, ділитися ними з іншими та отримувати
              AI-генеровані рекомендації. Застосунок інтегрується з TMDB API для
              доступу до повної бази даних фільмів, акторів та режисерів, а також
              використовує Google Gemini для генерації описів та пропозицій.
            </p>

            <div aria-label="Ключові слова дослідження">
              <h3>Ключові слова</h3>
              <ul role="list">
                {keywords.map((kw) => (
                  <li key={kw}>{kw}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Relevance */}
          <section id="relevance" aria-labelledby="relevance-heading">
            <h2 id="relevance-heading">Актуальність теми</h2>

            <p>
              У сучасному цифровому світі обсяг доступного кіноконтенту зростає
              експоненціально. Стрімінгові платформи пропонують десятки тисяч
              фільмів, що створює проблему вибору для глядачів. Існуючі рішення,
              такі як IMDb та Letterboxd, мають обмежені можливості для
              персоналізації та обміну кураторськими списками.
            </p>
            <p>
              Використання технологій штучного інтелекту для генерації
              персоналізованого контенту відкриває нові можливості для покращення
              користувацького досвіду. AI може аналізувати вподобання користувача,
              генерувати тематичні описи для списків фільмів та рекомендувати
              нові фільми на основі контексту вже обраних.
            </p>
            <p>
              Актуальність роботи підтверджується зростанням попиту на
              персоналізовані сервіси рекомендацій, що використовують сучасні
              мовні моделі для покращення взаємодії з контентом.
            </p>
          </section>

          {/* Goals */}
          <section id="goals" aria-labelledby="goals-heading">
            <h2 id="goals-heading">Мета та завдання</h2>

            <article>
              <h3>Мета дослідження</h3>
              <p>
                Розробити повнофункціональний веб-застосунок для створення,
                управління та обміну списками фільмів з інтеграцією TMDB API та
                AI-генерацією персоналізованого контенту за допомогою Google
                Gemini, що забезпечує зручний та сучасний користувацький досвід.
              </p>
            </article>

            <article>
              <h3>Основні завдання</h3>
              <ol aria-label="Список основних завдань дослідження">
                {tasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ol>
            </article>
          </section>

          {/* Methodology */}
          <section id="methodology" aria-labelledby="methodology-heading">
            <h2 id="methodology-heading">Методологія дослідження</h2>

            <p>
              Дослідження проводиться з використанням методів аналізу та
              проєктування програмного забезпечення:
            </p>

            <ul>
              <li>
                <strong>Аналіз предметної області</strong> — вивчення існуючих
                платформ (IMDb, Letterboxd, Trakt) для визначення переваг та
                недоліків
              </li>
              <li>
                <strong>Проєктування архітектури</strong> — застосування
                компонентного підходу з використанням App Router та Server
                Components у Next.js
              </li>
              <li>
                <strong>Інтеграція зовнішніх API</strong> — використання REST API
                (TMDB) та GenAI SDK (Google Gemini) для отримання даних та
                генерації контенту
              </li>
              <li>
                <strong>Ітеративна розробка</strong> — поступове нарощування
                функціональності з використанням GitHub Flow як стратегії
                гілкування
              </li>
              <li>
                <strong>Тестування та верифікація</strong> — перевірка
                працездатності через ручне тестування інтерфейсу та перевірку
                типів TypeScript
              </li>
            </ul>
          </section>

          {/* Results */}
          <section id="results" aria-labelledby="results-heading">
            <h2 id="results-heading">Очікувані результати</h2>

            <ul>
              <li>
                Повнофункціональний веб-застосунок CineList з можливістю
                створення, редагування та обміну списками фільмів
              </li>
              <li>
                Інтеграція з TMDB API, що надає доступ до інформації про понад
                900 000 фільмів, включаючи каст, знімальну групу, трейлери та
                рейтинги
              </li>
              <li>
                AI-модуль на базі Google Gemini, який генерує описи списків,
                рекомендації фільмів та аналітичний контент
              </li>
              <li>
                Система персональних рейтингів, списку перегляду (watchlist) та
                історії переглядів зі статистикою
              </li>
              <li>
                Соціальні функції: публічний доступ до списків, коментарі,
                лайки, форкінг та шаблони списків
              </li>
              <li>
                Детальні сторінки фільмів, акторів та режисерів з повною
                фільмографією
              </li>
            </ul>
          </section>

          {/* Tech Stack */}
          <section id="tech" aria-labelledby="tech-heading">
            <h2 id="tech-heading">Технологічний стек</h2>

            {techStack.map((group) => (
              <article key={group.category}>
                <h3>{group.category}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </main>

        {/* Contact */}
        <footer
          id="contact"
          role="contentinfo"
          aria-labelledby="contact-heading"
        >
          <h2 id="contact-heading">Контакти</h2>

          <address>
            <p>
              <strong>Автор:</strong> Попов Андрій
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:andriipopov.dev@gmail.com">
                andriipopov.dev@gmail.com
              </a>
            </p>
            <p>
              <strong>GitHub:</strong>{" "}
              <a
                href="https://github.com/andrew-dev-p/diploma"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/andrew-dev-p/diploma
              </a>
            </p>
            <p>
              <strong>Застосунок:</strong>{" "}
              <a
                href="https://cinelist.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                cinelist.vercel.app
              </a>
            </p>
          </address>

          <p>
            &copy; {new Date().getFullYear()} Попов Андрій. Бакалаврська робота.
          </p>
        </footer>
      </div>
    </>
  );
}
