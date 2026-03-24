import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero skeleton */}
      <div className="mx-auto max-w-2xl text-center">
        <Skeleton className="mx-auto h-12 w-3/4" />
        <Skeleton className="mx-auto mt-4 h-6 w-1/2" />
        <div className="mt-8 flex justify-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Movies skeleton */}
      <div className="mt-16">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[160px] shrink-0">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
