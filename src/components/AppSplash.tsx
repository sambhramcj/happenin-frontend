"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AppSplash() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
    >
      <motion.div
        className="relative w-[220px] sm:w-[260px]"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.03, opacity: 1 }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 0.2, 
          ease: "easeOut" 
        }}
      >
        <img
          src="/branding/logo-wordmark-brand.svg"
          alt="Happenin"
          className="w-full h-auto object-contain"
        />
      </motion.div>
    </motion.div>
  );
}
