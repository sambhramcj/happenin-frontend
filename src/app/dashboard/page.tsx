"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
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
      router.replace("/login");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-[#0f0519] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-purple-300 text-lg">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
