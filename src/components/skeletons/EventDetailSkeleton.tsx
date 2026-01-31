/**
 * Skeleton for event details page
 */
import { Skeleton } from "./SkeletonBase";

export function EventDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <p className="text-sm text-gray-500 text-center">Getting event details…</p>
      
      {/* Banner image */}
      <Skeleton className="w-full h-64 md:h-96" />
      
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="w-full h-8" variant="text" />
        <Skeleton className="w-3/4 h-8" variant="text" />
      </div>
      
      {/* Date/location */}
      <Skeleton className="w-1/2 h-5" variant="text" />
      
      {/* Price button */}
      <Skeleton className="w-32 h-12 rounded-full" />
      
      {/* Description */}
      <div className="space-y-2 mt-6">
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-2/3 h-4" variant="text" />
      </div>
    </div>
  );
}
