"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AppSplash() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0A1F]"
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
        {/* Logo with gradient */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {/* Event platform icon - simplified */}
            <circle 
              cx="50" 
              cy="35" 
              r="15" 
              fill="url(#logoGradient)" 
              opacity="0.95" 
            />
            <path 
              d="M25 75c3-15 15-23 25-23s22 8 25 23" 
              fill="url(#logoGradient)" 
              opacity="0.95" 
            />
          </svg>
        </div>
        
      </motion.div>
    </motion.div>
  );
}
