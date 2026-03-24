"use client"

/**
 * Global error boundary — catches errors in the root layout itself.
 * Since the root layout may be broken, this renders its own full HTML.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const errorId = error.digest ?? "unknown"

  return (
    <html lang="uk">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: "#dc2626" }}>
            500
          </h1>
          <h2 style={{ fontSize: 20, marginTop: 8 }}>Критична помилка</h2>
          <p style={{ marginTop: 12, color: "#a1a1aa", fontSize: 14 }}>
            Виникла серйозна помилка. Ми вже працюємо над її виправленням.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 24px",
              background: "#be185d",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Спробувати ще раз
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: "#71717a" }}>
            Код: {errorId}
          </p>
          <p style={{ marginTop: 4, fontSize: 12 }}>
            <a
              href={`mailto:andriipopov.dev@gmail.com?subject=CineList Critical Error: ${errorId}`}
              style={{ color: "#be185d" }}
            >
              Повідомити про проблему
            </a>
          </p>
        </div>
      </body>
    </html>
  )
}
