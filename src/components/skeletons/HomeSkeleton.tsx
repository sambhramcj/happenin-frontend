/**
 * Skeleton for home/explore - brain thinks content is already there
 */
import { Skeleton } from "./SkeletonBase";
import { HorizontalEventCardSkeleton, EventCardSkeleton } from "./EventCardSkeleton";

export function HomeExploreSkeleton() {
  return (
    <div className="space-y-8 p-4">
      {/* Top bar - college selector */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-full" variant="circle" />
      </div>
      
      {/* "Happening Today" section */}
      <div className="space-y-4">
        <Skeleton className="w-40 h-6" variant="text" />
        
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <HorizontalEventCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* "Trending" section */}
      <div className="space-y-4">
        <Skeleton className="w-32 h-6" variant="text" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
