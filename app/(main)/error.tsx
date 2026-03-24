"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/**
 * Global error boundary for the main (public) layout.
 * Displays a user-friendly error page with localized messaging,
 * recovery options, and an error reference ID for support.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const errorId = error.digest ?? "unknown"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <Card className="mx-auto max-w-md p-8 text-center">
        <h2 className="font-heading text-4xl font-bold text-destructive">
          Помилка
        </h2>
        <p className="mt-3 text-muted-foreground">
          Щось пішло не так. Ми вже працюємо над вирішенням проблеми.
        </p>

        <Separator className="my-6" />

        <p className="mb-4 text-sm text-muted-foreground">Що можна зробити:</p>
        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Спробувати ще раз
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.history.back()}
          >
            Повернутися назад
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            На головну
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            Код помилки:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {errorId}
            </code>
          </p>
          <p>
            <a
              href={`mailto:andriipopov.dev@gmail.com?subject=CineList Error: ${errorId}&body=Опишіть, що ви робили коли сталася помилка:%0A%0AКод помилки: ${errorId}`}
              className="text-primary hover:underline"
            >
              Повідомити про проблему
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
