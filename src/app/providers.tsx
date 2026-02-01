"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "next-themes";
import QueryProvider from "@/components/QueryProvider";
import OfflineBanner from "@/components/OfflineBanner";

function ToasterWrapper() {
  const { theme } = useTheme();
  
  return (
    <Toaster 
      position="top-right" 
      theme={theme === "dark" ? "dark" : "light"}
      richColors
      closeButton
    />
  );
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryProvider>
          <OfflineBanner />
          {children}
          <ToasterWrapper />
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
