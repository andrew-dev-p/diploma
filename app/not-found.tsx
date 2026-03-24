import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/**
 * Custom 404 error page with user-friendly messaging and navigation options.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <Card className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-heading text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Сторінку не знайдено</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Сторінка, яку ви шукаєте, не існує або була переміщена.
        </p>

        <Separator className="my-6" />

        <p className="mb-4 text-sm text-muted-foreground">Що можна зробити:</p>
        <div className="flex flex-col gap-2">
          <Link href="/">
            <Button className="w-full">На головну</Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" className="w-full">
              Переглянути списки
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline" className="w-full">
              Знайти фільми
            </Button>
          </Link>
        </div>

        <Separator className="my-6" />

        <p className="text-xs text-muted-foreground">
          Якщо ви вважаєте, що це помилка,{" "}
          <a
            href="mailto:andriipopov.dev@gmail.com?subject=CineList 404 Error"
            className="text-primary hover:underline"
          >
            повідомте нас
          </a>
          .
        </p>
      </Card>
    </div>
  )
}
