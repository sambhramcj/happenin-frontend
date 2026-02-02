"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AppSplash } from "./AppSplash";

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isInstalledPWA, setIsInstalledPWA] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if running as installed PWA
    const checkPWA = () => {
      // Multiple ways to detect PWA
      const isPWA = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsInstalledPWA(isPWA);
      return isPWA;
    };

    const isPWA = checkPWA();
    
    const initializeApp = async () => {
      try {
        // Only show splash for installed PWA (700ms minimum display time)
        if (isPWA) {
          await new Promise(resolve => setTimeout(resolve, 700));
        }
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
        {!isReady && isInstalledPWA && <AppSplash key="splash" />}
      </AnimatePresence>
      
      {isReady && children}
    </>
  );
}
