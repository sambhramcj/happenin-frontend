"use client";

import { useOnlineStatus } from "@/lib/offline";
import { getMotionDuration } from "@/lib/motion.config";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for prefers-reduced-motion on mount
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const transitionDuration = getMotionDuration(0.18);

  if (!mounted) {
    // Avoid SSR/client mismatch when offline on client but not known server-side
    return null;
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-8 flex items-center justify-center bg-warningSoft text-warning text-sm font-medium"
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 0.95 }}
          exit={{ y: -32, opacity: 0 }}
          transition={{
            duration: transitionDuration,
            ease: prefersReducedMotion ? "linear" : "easeOut",
          }}
        >
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full bg-warning ${
                prefersReducedMotion ? "" : "animate-pulse"
              }`}
            />
            You're offline · Actions will retry automatically
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// RETRY INDICATOR COMPONENT
export function RetryIndicator({ text = "Retrying" }: { text?: string }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (prefersReducedMotion) {
    // No animation if reduced motion preferred
    return (
      <span className="inline-flex items-center gap-1.5 text-text-muted text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        {text}
      </span>
    );
  }

  return (
    <motion.span
      className="inline-flex items-center gap-1.5 text-text-muted text-sm"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: getMotionDuration(1.2), repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
      {text}
    </motion.span>
  );
}

// VERIFYING INDICATOR (for payments)
export function VerifyingIndicator() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full spinner" />
        <p className="text-text-primary font-medium">Verifying payment…</p>
        <p className="text-text-muted text-sm">Please don't close this page</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] }}
      transition={{
        duration: getMotionDuration(1.5),
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full spinner" />
      <p className="text-text-primary font-medium">Verifying payment…</p>
      <p className="text-text-muted text-sm">Please don't close this page</p>
    </motion.div>
  );
}
