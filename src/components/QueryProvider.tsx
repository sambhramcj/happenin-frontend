"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 3,
            retryDelay: (attemptIndex) =>
              Math.min(1200 * Math.pow(1.8, attemptIndex), 5000),
          },
          mutations: {
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1200 * Math.pow(1.8, attemptIndex), 5000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
