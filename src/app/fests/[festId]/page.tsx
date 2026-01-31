"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import FestDetails from "@/components/FestDetails";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/skeletons";

export default function FestDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const festId = params?.festId as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-primary p-6 space-y-6">
        <p className="text-sm text-text-muted text-center">Loading events…</p>
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
          <Skeleton className="w-full h-48" />
          <div className="p-6 space-y-3">
            <Skeleton className="w-2/3 h-6" variant="text" />
            <Skeleton className="w-full h-4" variant="text" />
            <Skeleton className="w-1/2 h-4" variant="text" />
          </div>
        </div>
      </div>
    );
  }

  if (!festId) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Invalid fest ID</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-card border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors"
          >
            <Icons.ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-text-primary text-center flex-1">
            Fest Details
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <FestDetails festId={festId} onClose={() => router.back()} />
      </main>
    </div>
  );
}
