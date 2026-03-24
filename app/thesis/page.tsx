export default function ThesisPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav>
        <ul>
          <li>
            <a href="#about">Про роботу</a>
          </li>
          <li>
            <a href="#relevance">Актуальність</a>
          </li>
          <li>
            <a href="#goals">Мета та завдання</a>
          </li>
          <li>
            <a href="#methodology">Методологія</a>
          </li>
          <li>
            <a href="#results">Результати</a>
          </li>
          <li>
            <a href="#contact">Контакти</a>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <header id="hero">
        <h1>
          Веб-застосунок для створення та обміну списками фільмів з
          використанням TMDB API та AI-генерації персоналізованого контенту
        </h1>
        <p>
          Web Application for Creating and Sharing Movie Lists Using TMDB API
          and AI-Generated Personalized Content
        </p>
        <p>Попов Андрій</p>
      </header>

      {/* About */}
      <section id="about">
        <h2>Про роботу</h2>
        <p>Короткий опис</p>
        <p>Ключові слова</p>
      </section>

      {/* Relevance */}
      <section id="relevance">
        <h2>Актуальність теми</h2>
        <p>Зміст буде додано.</p>
      </section>

      {/* Goals */}
      <section id="goals">
        <h2>Мета та завдання</h2>
        <p>Зміст буде додано.</p>
      </section>

      {/* Methodology */}
      <section id="methodology">
        <h2>Методологія дослідження</h2>
        <p>Зміст буде додано.</p>
      </section>

      {/* Results */}
      <section id="results">
        <h2>Очікувані результати</h2>
        <p>Зміст буде додано.</p>
      </section>

      {/* Contact */}
      <footer id="contact">
        <h2>Контакти</h2>
        <p>Зміст буде додано.</p>
      </footer>
    </div>
  );
}
