/**
 * Offline/Retry banner - builds trust during connectivity issues
 */
"use client";

import { useEffect, useState } from "react";
import { Icons } from "./icons";

export function OfflineRetryBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't show banner if online
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
        <>
          <Icons.WifiOff className="h-4 w-4" />
          <span>You're offline. We'll retry automatically.</span>
          <Icons.Loader2 className="h-4 w-4 animate-spin opacity-80" />
          <span className="sr-only">Trying again when you're back online</span>
        </>
      </div>
    </div>
  );
}
