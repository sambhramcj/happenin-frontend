"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("App installation not available");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast.success("App installed successfully!");
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Installation failed:", error);
      toast.error("Installation failed");
    }
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-bg-card border border-border-default rounded-xl p-4 shadow-lg z-40 md:bottom-6 md:right-6 md:left-auto md:w-80">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-text-primary mb-1">Install Happenin</h3>
          <p className="text-sm text-text-secondary mb-3">
            Install Happenin as an app for better experience and offline support
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover transition-all font-medium text-sm"
            >
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-bg-muted text-text-primary py-2 rounded-lg hover:bg-border-default transition-all font-medium text-sm"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-text-secondary hover:text-text-primary mt-1"
        >
          <Icons.X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
