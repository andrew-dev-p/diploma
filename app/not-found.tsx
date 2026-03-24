import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <h1 className="font-heading text-6xl font-bold">404</h1>
      <p className="text-muted-foreground mt-2 text-lg">Page not found</p>
      <p className="text-muted-foreground mt-1 text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="mt-6">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
