import { Skeleton } from "@/components/ui/skeleton"

export default function MovieDetailLoading() {
  return (
    <div>
      <Skeleton className="h-64 w-full sm:h-80 md:h-96" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-32 flex flex-col gap-8 md:flex-row">
          <Skeleton className="aspect-[2/3] w-48 rounded-xl md:w-56" />
          <div className="flex-1 pt-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="mt-2 h-5 w-1/2" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="mt-4 h-4 w-48" />
            <Skeleton className="mt-4 h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
