"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AppSplash } from "./AppSplash";

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const initializeApp = async () => {
      try {
        // Minimum display time for premium feel (700ms)
        await new Promise(resolve => setTimeout(resolve, 700));
        setIsReady(true);
      } catch (error) {
        console.error("App initialization error:", error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  // Don't render anything until mounted (avoid hydration issues)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!isReady && <AppSplash key="splash" />}
      </AnimatePresence>
      
      {isReady && children}
    </>
  );
}
