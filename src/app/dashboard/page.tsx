"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeExploreSkeleton } from "@/components/skeletons";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/auth");
      return;
    }

    const role = (session.user as any).role;

    if (role === "student") {
      router.replace("/dashboard/student");
    } else if (role === "organizer") {
      router.replace("/dashboard/organizer");
    } else if (role === "admin") {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/auth");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-bg-muted">
      <HomeExploreSkeleton />
    </div>
  );
}
