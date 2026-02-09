/**
 * Payment flow loading states - builds trust during critical moments
 */
"use client";

import { Icons } from "./icons";
import { useEffect, useState } from "react";

interface PaymentLoadingProps {
  stage: "creating" | "confirming" | "pending" | "success";
  onContinue?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function PaymentLoading({ stage, onContinue, actionLabel, onAction }: PaymentLoadingProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
        {stage === "creating" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Icons.Lock className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Securing your slot{dots}
            </h3>
          </>
        )}

        {stage === "confirming" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Icons.Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirming registration{dots}
            </h3>
          </>
        )}

        {stage === "pending" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Icons.Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment received. Finalizing ticket{dots}
            </h3>
            {onContinue && (
              <button
                onClick={onContinue}
                className="mt-4 w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryHover transition-all"
              >
                View ticket (may take a few seconds)
              </button>
            )}
          </>
        )}

        {stage === "success" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Icons.Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Registration confirmed!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your ticket is ready
            </p>
            {onAction && actionLabel && (
              <button
                onClick={onAction}
                className="mt-2 w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryHover transition-all"
              >
                {actionLabel}
              </button>
            )}
            {onContinue && (
              <button
                onClick={onContinue}
                className="mt-2 w-full bg-bg-muted text-text-primary px-6 py-3 rounded-lg border border-border-default hover:bg-bg-card transition-all"
              >
                View ticket
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
