import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineRetryBanner } from "@/components/OfflineRetryBanner";
import { SplashScreenWrapper } from "@/components/SplashScreenWrapper";

import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Happenin - Event Discovery Platform",
  description: "Discover and attend amazing events near you. Connect with communities and create memories.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Happenin" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <Providers>
            <OfflineRetryBanner />
          <SplashScreenWrapper>
            {children}
            <PWAInstallPrompt />
          </SplashScreenWrapper>
        </Providers>
      </body>
    </html>
  );
}
