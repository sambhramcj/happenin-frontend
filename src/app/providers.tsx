"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import QueryProvider from "@/components/QueryProvider";
import OfflineBanner from "@/components/OfflineBanner";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <OfflineBanner />
        {children}
        <Toaster 
          position="top-right" 
          theme="light"
          richColors
          closeButton
        />
      </QueryProvider>
    </SessionProvider>
  );
}
