import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
    items: [
      "Next.js 16 (App Router)",
      "React 19",
      "TypeScript",
      "Tailwind CSS 4",
      "shadcn/ui",
      "Radix UI",
    ],
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
    items: [
      "TMDB API (фільми, актори, жанри)",
      "Google Gemini (AI-генерація)",
    ],
  },
  {
    category: "Аутентифікація",
    items: ["Clerk (Google OAuth)"],
  },
];

const methodologyItems = [
  {
    title: "Аналіз предметної області",
    description:
      "Вивчення існуючих платформ (IMDb, Letterboxd, Trakt) для визначення переваг та недоліків",
  },
  {
    title: "Проєктування архітектури",
    description:
      "Застосування компонентного підходу з використанням App Router та Server Components у Next.js",
  },
  {
    title: "Інтеграція зовнішніх API",
    description:
      "Використання REST API (TMDB) та GenAI SDK (Google Gemini) для отримання даних та генерації контенту",
  },
  {
    title: "Ітеративна розробка",
    description:
      "Поступове нарощування функціональності з використанням GitHub Flow як стратегії гілкування",
  },
  {
    title: "Тестування та верифікація",
    description:
      "Перевірка працездатності через ручне тестування інтерфейсу та перевірку типів TypeScript",
  },
];

const results = [
  "Повнофункціональний веб-застосунок CineList з можливістю створення, редагування та обміну списками фільмів",
  "Інтеграція з TMDB API, що надає доступ до інформації про понад 900 000 фільмів, включаючи каст, знімальну групу, трейлери та рейтинги",
  "AI-модуль на базі Google Gemini, який генерує описи списків, рекомендації фільмів та аналітичний контент",
  "Система персональних рейтингів, списку перегляду (watchlist) та історії переглядів зі статистикою",
  "Соціальні функції: публічний доступ до списків, коментарі, лайки, форкінг та шаблони списків",
  "Детальні сторінки фільмів, акторів та режисерів з повною фільмографією",
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

        {/* Sticky Navigation */}
        <nav
          aria-label="Навігація сторінкою бакалаврської роботи"
          className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-center justify-between py-3">
              <Link
                href="/"
                className="font-heading text-lg font-bold text-primary"
              >
                CineList
              </Link>
              <ul
                role="list"
                className="hidden gap-1 md:flex"
              >
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-label={`Перейти до секції: ${s.label}`}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header
          id="hero"
          role="banner"
          className="relative overflow-hidden border-b border-border/30"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            {/* University logo */}
            <div
              aria-label="Логотип університету"
              className="mb-8"
            >
              <Image
                src="/university-logo.svg"
                alt="Логотип Національного технічного університету України «Київський політехнічний інститут імені Ігоря Сікорського»"
                width={80}
                height={80}
                priority
                className="rounded-xl"
              />
            </div>

            <Badge variant="secondary" className="mb-4">
              Бакалаврська робота
            </Badge>

            <h1
              lang="uk"
              className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              Веб-застосунок для створення та обміну списками фільмів з
              використанням TMDB&nbsp;API та AI&#8209;генерації
              персоналізованого контенту
            </h1>

            <p
              lang="en"
              aria-label="Thesis title in English"
              className="mt-4 max-w-3xl text-lg text-muted-foreground sm:text-xl"
            >
              Web Application for Creating and Sharing Movie Lists Using
              TMDB&nbsp;API and AI&#8209;Generated Personalized Content
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">Автор:</strong> Попов Андрій
              </span>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <span>2026</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href="https://cinelist.vercel.app" target="_blank" rel="noopener noreferrer">
                  Відкрити застосунок
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/andrew-dev-p/diploma" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </header>

        <main id="main-content" role="main" className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* About */}
          <section
            id="about"
            aria-labelledby="about-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="about-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Про роботу
            </h2>
            <Separator className="my-4" />

            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              CineList — це веб-застосунок, який дозволяє користувачам створювати
              персоналізовані списки фільмів, ділитися ними з іншими та отримувати
              AI-генеровані рекомендації. Застосунок інтегрується з TMDB API для
              доступу до повної бази даних фільмів, акторів та режисерів, а також
              використовує Google Gemini для генерації описів та пропозицій.
            </p>

            <div aria-label="Ключові слова дослідження" className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ключові слова
              </h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="outline">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* Relevance */}
          <section
            id="relevance"
            aria-labelledby="relevance-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="relevance-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Актуальність теми
            </h2>
            <Separator className="my-4" />

            <div className="max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
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
            </div>
          </section>

          {/* Goals */}
          <section
            id="goals"
            aria-labelledby="goals-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="goals-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Мета та завдання
            </h2>
            <Separator className="my-4" />

            <article className="mb-8">
              <h3 className="mb-3 text-lg font-semibold">Мета дослідження</h3>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Розробити повнофункціональний веб-застосунок для створення,
                управління та обміну списками фільмів з інтеграцією TMDB API та
                AI-генерацією персоналізованого контенту за допомогою Google
                Gemini, що забезпечує зручний та сучасний користувацький досвід.
              </p>
            </article>

            <article>
              <h3 className="mb-4 text-lg font-semibold">Основні завдання</h3>
              <ol
                aria-label="Список основних завдань дослідження"
                className="space-y-3"
              >
                {tasks.map((task, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-base leading-relaxed text-muted-foreground pt-0.5">
                      {task}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          </section>

          {/* Methodology */}
          <section
            id="methodology"
            aria-labelledby="methodology-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="methodology-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Методологія дослідження
            </h2>
            <Separator className="my-4" />

            <p className="mb-6 max-w-3xl text-base text-muted-foreground sm:text-lg">
              Дослідження проводиться з використанням методів аналізу та
              проєктування програмного забезпечення:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {methodologyItems.map((item) => (
                <Card key={item.title} className="p-5">
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* Results */}
          <section
            id="results"
            aria-labelledby="results-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="results-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Очікувані результати
            </h2>
            <Separator className="my-4" />

            <ul className="space-y-3">
              {results.map((result, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-base leading-relaxed text-muted-foreground">
                    {result}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tech Stack */}
          <section
            id="tech"
            aria-labelledby="tech-heading"
            className="py-12 sm:py-16"
          >
            <h2
              id="tech-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Технологічний стек
            </h2>
            <Separator className="my-4" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {techStack.map((group) => (
                <Card key={group.category} className="p-5">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                    {group.category}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>
        </main>

        {/* Contact */}
        <footer
          id="contact"
          role="contentinfo"
          aria-labelledby="contact-heading"
          className="border-t border-border/50 bg-card/50"
        >
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="contact-heading"
              className="font-heading text-2xl font-bold sm:text-3xl"
            >
              Контакти
            </h2>
            <Separator className="my-4" />

            <address className="not-italic">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Автор
                  </p>
                  <p className="mt-1 text-lg">Попов Андрій</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <a
                    href="mailto:andriipopov.dev@gmail.com"
                    className="mt-1 block text-lg text-primary hover:underline"
                  >
                    andriipopov.dev@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    GitHub
                  </p>
                  <a
                    href="https://github.com/andrew-dev-p/diploma"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-lg text-primary hover:underline"
                  >
                    github.com/andrew-dev-p/diploma
                  </a>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Застосунок
                  </p>
                  <a
                    href="https://cinelist.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-lg text-primary hover:underline"
                  >
                    cinelist.vercel.app
                  </a>
                </div>
              </div>
            </address>

            <Separator className="my-8" />

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Попов Андрій. Бакалаврська
              робота.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
