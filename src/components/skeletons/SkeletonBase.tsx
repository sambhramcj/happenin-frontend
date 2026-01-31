/**
 * Base skeleton component - respects reduced motion, classy pulse
 */
"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circle" | "text";
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "bg-bg-muted",
        !prefersReducedMotion && "animate-pulse",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded-sm h-4",
        variant === "default" && "rounded-lg",
        className
      )}
      style={!prefersReducedMotion ? { animationDuration: "1.4s" } : undefined}
      aria-hidden="true"
    />
  );
}
