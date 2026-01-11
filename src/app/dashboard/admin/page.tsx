"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [totalEvents, setTotalEvents] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [topEvents, setTopEvents] = useState<
    { title: string; registrations: number }[]
  >([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "admin") {
      router.replace("/login");
      return;
    }

    fetchStats();
  }, [session, status, router]);

  async function fetchStats() {
    // Total events
    const { count: eventCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    setTotalEvents(eventCount || 0);

    // Total registrations + revenue
    const { data: registrations } = await supabase
      .from("registrations")
      .select("final_price");

    setTotalRegistrations(registrations?.length || 0);

    const revenue =
      registrations?.reduce(
        (sum, r) => sum + Number(r.final_price),
        0
      ) || 0;

    setTotalRevenue(revenue);

    // Top events by registrations
    const { data: grouped } = await supabase.rpc(
      "top_events_by_registrations"
    );

    if (grouped) {
      setTopEvents(grouped);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f0519] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Strict role check - prevent unauthorized access
  if (!session?.user || (session.user as any).role !== "admin") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0f0519]">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-200 mb-2">Admin Dashboard</h1>
          <p className="text-purple-400">Overview of events, registrations, and revenue</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-300">Total Events</p>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-purple-200">{totalEvents}</p>
          </div>

          <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-300">Total Registrations</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-purple-200">{totalRegistrations}</p>
          </div>

          <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-300">Total Revenue</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-purple-200">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 sm:p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-purple-200 mb-6 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Top Events by Registrations
          </h2>

          {topEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-purple-300 text-lg">No registration data yet.</p>
              <p className="text-purple-500 text-sm mt-2">Events will appear here once students start registering.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topEvents.map((e, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-[#1a0b2e] rounded-lg border border-purple-500/20 hover:border-purple-500/40 hover:bg-[#2d1b4e] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-purple-200">{e.title}</p>
                      <p className="text-sm text-purple-400">{e.registrations} {e.registrations === 1 ? 'registration' : 'registrations'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                      <span>✓</span>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
