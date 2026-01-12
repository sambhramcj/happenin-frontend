export function SkeletonCard() {
  return (
    <div className="bg-[#2d1b4e] border border-purple-500/20 rounded-xl overflow-hidden shadow-md animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-[#1a0b2e]"></div>
      
      {/* Content skeleton */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Title skeleton */}
            <div className="h-6 bg-[#1a0b2e] rounded w-3/4"></div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-[#1a0b2e] rounded w-full"></div>
              <div className="h-4 bg-[#1a0b2e] rounded w-5/6"></div>
            </div>
            
            {/* Details skeleton */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-[#1a0b2e] rounded w-1/2"></div>
              <div className="h-4 bg-[#1a0b2e] rounded w-1/2"></div>
              <div className="h-4 bg-[#1a0b2e] rounded w-1/3"></div>
            </div>
          </div>
          
          {/* Button skeleton */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="h-10 bg-[#1a0b2e] rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
