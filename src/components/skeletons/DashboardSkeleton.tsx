/**
 * Skeleton for organizer dashboard - numbers matter
 */
import { Skeleton } from "./SkeletonBase";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 space-y-3 border border-gray-200 dark:border-gray-800">
          {/* Stat label */}
          <Skeleton className="w-24 h-4" variant="text" />
          
          {/* Stat number */}
          <Skeleton className="w-16 h-8" />
        </div>
      ))}
    </div>
  );
}

export function DashboardEventListSkeleton() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Fetching registrations…</p>
      
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-800">
          {/* Event image */}
          <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
          
          {/* Event details */}
          <div className="flex-1 space-y-2">
            <Skeleton className="w-2/3 h-5" variant="text" />
            <Skeleton className="w-1/3 h-4" variant="text" />
          </div>
          
          {/* Stats */}
          <Skeleton className="w-12 h-8" />
        </div>
      ))}
    </div>
  );
}
