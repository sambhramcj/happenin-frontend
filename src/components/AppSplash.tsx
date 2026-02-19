"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function AppSplash() {
  const prefersReducedMotion = useReducedMotion();
  const [bgClass, setBgClass] = useState("bg-[#0F0A1F]");

  useEffect(() => {
    // Detect current theme and use it for splash screen
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setBgClass(isDark ? "bg-[#0F0A1F]" : "bg-white");
    }
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${bgClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.03, opacity: 1 }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 0.2, 
          ease: "easeOut" 
        }}
      >
        {/* Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img src="/icon.svg" alt="Happenin" className="w-full h-full object-contain" />
        </div>
        
      </motion.div>
    </motion.div>
  );
}
