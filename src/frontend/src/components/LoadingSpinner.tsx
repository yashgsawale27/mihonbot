import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

export function MangaCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="w-full aspect-[2/3]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function WatchlistCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex gap-3">
      <Skeleton className="w-14 h-18 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
