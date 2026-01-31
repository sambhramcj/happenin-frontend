/**
 * Quick verification that skeleton components can be imported
 */
"use client";

import { Skeleton } from "./index";
import { EventCardSkeleton } from "./EventCardSkeleton";
import { DashboardStatsSkeleton } from "./DashboardSkeleton";

export function SkeletonTest() {
  return (
    <div>
      <Skeleton className="h-4 w-32" />
      <EventCardSkeleton />
      <DashboardStatsSkeleton count={3} />
    </div>
  );
}
