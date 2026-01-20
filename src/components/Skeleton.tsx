// HAPPENIN — SKELETON LOADING COMPONENT
// Uses design tokens from motion.css

export default function Skeleton({ 
  className = "", 
  width, 
  height 
}: { 
  className?: string; 
  width?: string | number; 
  height?: string | number;
}) {
  const style: React.CSSProperties = {};
  
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div 
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// PRESET SKELETONS

export function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border-default rounded-lg p-6 space-y-3">
      <Skeleton height={120} className="w-full" />
      <Skeleton height={24} width="70%" />
      <Skeleton height={16} width="50%" />
      <div className="flex gap-2 pt-2">
        <Skeleton height={32} width={80} />
        <Skeleton height={32} width={80} />
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

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height={16} 
          width={i === lines - 1 ? "60%" : "100%"} 
        />
      ))}
    </div>
  );
}
