/**
 * Skeletons for admin dashboard - utilitarian
 */
import { Skeleton } from "./SkeletonBase";

export function AdminTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Skeleton className="w-40 h-5" variant="text" />
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/2 h-4" variant="text" />
              <Skeleton className="w-1/3 h-3" variant="text" />
            </div>
            <Skeleton className="w-20 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTimelineSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <Skeleton className="w-32 h-5" variant="text" />
      <div className="mt-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="w-3 h-3 rounded-full mt-2" variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-2/3 h-4" variant="text" />
              <Skeleton className="w-1/2 h-3" variant="text" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
