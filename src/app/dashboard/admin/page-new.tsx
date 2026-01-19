"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: string;
  organizer_email: string;
  banner_image?: string;
  created_at: string;
};

type Registration = {
  id: string;
  student_email: string;
  event_id: string;
  final_price: number;
  created_at: string;
};

type User = {
  email: string;
  role: string;
  created_at: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "colleges" | "events" | "payments" | "users">("overview");
  const [usersSubTab, setUsersSubTab] = useState<"students" | "organizers">("students");

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [eventFilter, setEventFilter] = useState<"all" | "today" | "week" | "flagged">("all");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "admin") {
      router.replace("/login");
      return;
    }

    fetchAllData();
  }, [session, status, router]);

  async function fetchAllData() {
    await Promise.all([
      fetchEvents(),
      fetchRegistrations(),
      fetchUsers(),
    ]);
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    setEvents(data || []);
  }

  async function fetchRegistrations() {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    setRegistrations(data || []);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from("users")
      .select("email, role, created_at")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

  // Analytics
  function getTotalColleges() {
    // Unique colleges from events (assuming organizer_email domain is college)
    const colleges = new Set(
      events.map(e => e.organizer_email?.split('@')[1]).filter(Boolean)
    );
    return colleges.size;
  }

  function getEventsToday() {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.date).toDateString() === today);
  }

  function getRegistrationsToday() {
    const today = new Date().toDateString();
    return registrations.filter(r => 
      new Date(r.created_at).toDateString() === today
    );
  }

  function getRevenueToday() {
    return getRegistrationsToday().reduce((sum, r) => sum + r.final_price, 0);
  }

  function getTotalRevenue() {
    return registrations.reduce((sum, r) => sum + r.final_price, 0);
  }

  function getFailedPayments() {
    // Placeholder - would need actual payment failure tracking
    return 0;
  }

  function getFilteredEvents() {
    let filtered = [...events];

    if (eventFilter === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(e => new Date(e.date).toDateString() === today);
    } else if (eventFilter === "week") {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= weekFromNow;
      });
    }

    return filtered;
  }

  function getEventRegistrationCount(eventId: string) {
    return registrations.filter(r => r.event_id === eventId).length;
  }

  function getEventRevenue(eventId: string) {
    return registrations
      .filter(r => r.event_id === eventId)
      .reduce((sum, r) => sum + r.final_price, 0);
  }

  function getFilteredUsers() {
    let filtered = users.filter(u => u.role === usersSubTab.slice(0, -1)); // Remove 's' from end

    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }

  function getUserRegistrations(email: string) {
    return registrations.filter(r => r.student_email === email);
  }

  function getUserEvents(email: string) {
    return events.filter(e => e.organizer_email === email);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] pb-24">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-[#1a0b2e]/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center border border-red-500/30">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-purple-200">Admin Control</h1>
              <p className="text-xs text-purple-400">Platform Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Global Snapshot */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>📊</span> Global Snapshot
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">🏫</div>
                  <div className="text-3xl font-bold text-purple-100">{getTotalColleges()}</div>
                  <div className="text-sm text-purple-400">Colleges Live</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-3xl font-bold text-purple-100">{getEventsToday().length}</div>
                  <div className="text-sm text-purple-400">Events Today</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">🎟</div>
                  <div className="text-3xl font-bold text-purple-100">{getRegistrationsToday().length}</div>
                  <div className="text-sm text-purple-400">Regs Today</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-3xl font-bold text-purple-100">₹{getRevenueToday()}</div>
                  <div className="text-sm text-purple-400">Revenue Today</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-3xl font-bold text-red-300">{getFailedPayments()}</div>
                  <div className="text-sm text-purple-400">Failed Payments</div>
                </div>
              </div>
            </section>

            {/* Activity Timeline */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>📈</span> Recent Activity (24h)
              </h2>
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-[#1a0b2e] rounded-lg">
                      <span className="text-2xl">✨</span>
                      <div className="flex-1">
                        <p className="text-purple-200 font-medium">{event.title}</p>
                        <p className="text-xs text-purple-400">Created by {event.organizer_email}</p>
                      </div>
                      <span className="text-xs text-purple-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="text-purple-400 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </section>

            {/* Alerts */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>🚨</span> Critical Alerts
              </h2>
              <div className="bg-[#2d1b4e]/50 rounded-xl p-8 text-center border border-purple-500/20">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-purple-300">All systems operational</p>
                <p className="text-sm text-purple-500 mt-2">No critical alerts at this time</p>
              </div>
            </section>
          </div>
        )}

        {/* COLLEGES TAB */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
              <span>🏫</span> Colleges ({getTotalColleges()})
            </h2>

            <div className="bg-[#2d1b4e]/50 rounded-xl p-8 text-center border border-purple-500/20">
              <div className="text-5xl mb-3">🏗️</div>
              <p className="text-purple-300">College management coming soon</p>
              <p className="text-sm text-purple-500 mt-2">View and manage registered colleges</p>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
                <span>📅</span> All Events ({events.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["all", "today", "week"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    eventFilter === filter
                      ? "bg-purple-600 text-white"
                      : "bg-[#2d1b4e] text-purple-300 hover:bg-purple-600/30"
                  }`}
                >
                  {filter === "all" ? "All Events" : filter === "today" ? "Today" : "This Week"}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-4">
              {getFilteredEvents().map((event) => {
                const regCount = getEventRegistrationCount(event.id);
                const revenue = getEventRevenue(event.id);

                return (
                  <div key={event.id} className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-purple-100 mb-2">{event.title}</h3>
                        <p className="text-sm text-purple-400 mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-purple-300">
                          <span>👤 {event.organizer_email}</span>
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          <span>📍 {event.location}</span>
                          <span>💰 ₹{event.price}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-xs font-semibold border border-green-500/30">
                        🟢 Active
                      </span>
                    </div>
                    <div className="flex items-center gap-6 pt-4 border-t border-purple-500/20">
                      <div>
                        <div className="text-2xl font-bold text-purple-200">{regCount}</div>
                        <div className="text-xs text-purple-400">Registrations</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-200">₹{revenue}</div>
                        <div className="text-xs text-purple-400">Revenue</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
              <span>💰</span> Payments
            </h2>

            {/* Payment Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                <div className="text-sm text-purple-400 mb-2">Total Revenue</div>
                <div className="text-2xl font-bold text-purple-100">₹{getTotalRevenue()}</div>
              </div>
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                <div className="text-sm text-purple-400 mb-2">Transactions</div>
                <div className="text-2xl font-bold text-purple-100">{registrations.length}</div>
              </div>
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                <div className="text-sm text-purple-400 mb-2">Today</div>
                <div className="text-2xl font-bold text-purple-100">₹{getRevenueToday()}</div>
              </div>
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                <div className="text-sm text-purple-400 mb-2">Failed</div>
                <div className="text-2xl font-bold text-red-300">{getFailedPayments()}</div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/20">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a0b2e]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/20">
                    {registrations.slice(0, 10).map((reg) => {
                      const event = events.find(e => e.id === reg.event_id);
                      return (
                        <tr key={reg.id} className="hover:bg-[#1a0b2e]/50">
                          <td className="px-6 py-4 text-sm text-purple-200">{reg.student_email}</td>
                          <td className="px-6 py-4 text-sm text-purple-300">{event?.title || 'Unknown'}</td>
                          <td className="px-6 py-4 text-sm text-purple-100 font-semibold">₹{reg.final_price}</td>
                          <td className="px-6 py-4 text-sm text-purple-400">
                            {new Date(reg.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
              <span>👥</span> Users
            </h2>

            {/* Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setUsersSubTab("students")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  usersSubTab === "students"
                    ? "bg-purple-600 text-white"
                    : "bg-[#2d1b4e] text-purple-300 hover:bg-purple-600/30"
                }`}
              >
                Students ({users.filter(u => u.role === "student").length})
              </button>
              <button
                onClick={() => setUsersSubTab("organizers")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  usersSubTab === "organizers"
                    ? "bg-purple-600 text-white"
                    : "bg-[#2d1b4e] text-purple-300 hover:bg-purple-600/30"
                }`}
              >
                Organizers ({users.filter(u => u.role === "organizer").length})
              </button>
            </div>

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2d1b4e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* User List */}
            <div className="space-y-3">
              {getFilteredUsers().map((user) => {
                const userRegs = getUserRegistrations(user.email);
                const userEvents = getUserEvents(user.email);

                return (
                  <div
                    key={user.email}
                    onClick={() => setSelectedUser(user)}
                    className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/60 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-purple-100 mb-2">{user.email}</h3>
                        <div className="flex gap-4 text-sm text-purple-400">
                          <span>📅 Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          {usersSubTab === "students" && (
                            <span>🎟 {userRegs.length} registrations</span>
                          )}
                          {usersSubTab === "organizers" && (
                            <span>📅 {userEvents.length} events</span>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs font-semibold border border-purple-500/30">
                        {user.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0b2e]/95 backdrop-blur-md border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto flex justify-around items-center py-3">
          {[
            { id: "overview", icon: "📊", label: "Overview" },
            { id: "colleges", icon: "🏫", label: "Colleges" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "payments", icon: "💰", label: "Payments" },
            { id: "users", icon: "👥", label: "Users" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "text-purple-300 bg-purple-600/20"
                  : "text-purple-500 hover:text-purple-300"
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
