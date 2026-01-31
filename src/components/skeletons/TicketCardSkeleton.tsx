/**
 * Skeleton for ticket cards - matches ticket shape
 */
import { Skeleton } from "./SkeletonBase";

export function TicketCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-4 border border-gray-200 dark:border-gray-800">
      {/* QR placeholder */}
      <div className="flex justify-center">
        <Skeleton className="w-32 h-32" />
      </div>
      
      {/* Event name */}
      <div className="space-y-2">
        <Skeleton className="w-full h-5" variant="text" />
        <Skeleton className="w-2/3 h-5" variant="text" />
      </div>
      
      {/* Ticket ID */}
      <Skeleton className="w-1/2 h-4" variant="text" />
      
      {/* Date */}
      <Skeleton className="w-1/3 h-4" variant="text" />
    </div>
  );
}
