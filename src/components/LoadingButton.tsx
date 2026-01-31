/**
 * Button with built-in loading state - micro interactions done right
 */
"use client";

import { Icons } from "./icons";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  variant = "primary",
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primaryHover active:scale-95",
    secondary: "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700",
    ghost: "bg-transparent text-primary hover:bg-primary/10",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
