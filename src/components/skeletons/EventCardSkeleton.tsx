/**
 * Skeleton for event cards - looks like the real thing
 */
import { Skeleton } from "./SkeletonBase";

export function EventCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Image block */}
      <Skeleton className="w-full h-48" />
      
      <div className="p-4 space-y-3">
        {/* Badge pill */}
        <Skeleton className="w-20 h-6 rounded-full" />
        
        {/* Title lines */}
        <Skeleton className="w-full h-5" variant="text" />
        <Skeleton className="w-3/4 h-5" variant="text" />
        
        {/* Date/location */}
        <Skeleton className="w-1/2 h-4" variant="text" />
        
        {/* Price button */}
        <Skeleton className="w-24 h-9 rounded-lg mt-2" />
      </div>
    </div>
  );
}

export function HorizontalEventCardSkeleton() {
  return (
    <div className="flex gap-3 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 p-3 min-w-[280px]">
      {/* Image block */}
      <Skeleton className="w-20 h-20 flex-shrink-0 rounded-lg" />
      
      <div className="flex-1 space-y-2">
        {/* Badge */}
        <Skeleton className="w-16 h-5 rounded-full" />
        
        {/* Title */}
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-2/3 h-4" variant="text" />
        
        {/* Date */}
        <Skeleton className="w-1/3 h-3" variant="text" />
      </div>
    </div>
  );
}
