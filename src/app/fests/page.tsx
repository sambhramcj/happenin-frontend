"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FestCreate from "@/components/FestCreate";
import FestDetails from "@/components/FestDetails";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Fest {
  id: string;
  title: string;
  description: string;
  banner_image?: string;
  start_date: string;
  end_date: string;
  location: string;
  core_team_leader_email: string;
}

export default function FestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFestId, setSelectedFestId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
      return;
    }

    if (status === "authenticated") {
      fetchFests();
    }
  }, [status, router]);

  const fetchFests = async () => {
    try {
      const res = await fetch("/api/fests");
      if (res.ok) {
        const data = await res.json();
        setFests(data.fests || []);
      }
    } catch (error) {
      console.error("Error fetching fests:", error);
      toast.error("Failed to load fests");
    } finally {
      setLoading(false);
    }
  };

  const isLeader = (fest: Fest) =>
    fest.core_team_leader_email === session?.user?.email;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-bg-muted rounded-lg transition-all"
            >
              <Icons.ChevronLeft className="h-5 w-5 text-text-primary" />
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Fests</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Detail View */}
        {selectedFestId && (
          <div>
            <FestDetails
              festId={selectedFestId}
              onClose={() => {
                setSelectedFestId(null);
                fetchFests();
              }}
            />
          </div>
        )}

        {/* List View */}
        {!selectedFestId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icons.Flame className="h-5 w-5 text-primary" /> All Fests
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all font-medium shadow-md"
              >
                {showCreateForm ? "Cancel" : "+ Create Fest"}
              </button>
            </div>

            {showCreateForm && (
              <FestCreate
                onSuccess={() => {
                  setShowCreateForm(false);
                  fetchFests();
                }}
                onClose={() => setShowCreateForm(false)}
              />
            )}

            {/* Fests Grid */}
            {fests.length === 0 ? (
              <div className="bg-bg-card rounded-xl p-12 text-center border border-border-default">
                <Icons.Flame className="h-16 w-16 text-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-text-muted mb-4">No fests yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-all font-medium"
                >
                  Create the First Fest
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fests.map((fest) => {
                  const isActive =
                    new Date(fest.start_date) <= new Date() &&
                    new Date() <= new Date(fest.end_date);
                  const isPast = new Date() > new Date(fest.end_date);

                  return (
                    <div
                      key={fest.id}
                      className="bg-bg-card rounded-xl overflow-hidden border border-border-default hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedFestId(fest.id)}
                    >
                      {/* Banner */}
                      {fest.banner_image ? (
                        <img
                          src={fest.banner_image}
                          alt={fest.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                          <Icons.Flame className="h-12 w-12 text-primary/50" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-text-primary line-clamp-1 flex-1">
                            {fest.title}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${
                              isActive
                                ? "bg-green-900/20 text-green-400 border-green-700/50"
                                : isPast
                                ? "bg-gray-900/20 text-gray-400 border-gray-700/50"
                                : "bg-blue-900/20 text-blue-400 border-blue-700/50"
                            }`}
                          >
                            {isActive ? "Active" : isPast ? "Ended" : "Upcoming"}
                          </span>
                        </div>

                        <p className="text-sm text-text-muted mb-3 line-clamp-2">
                          {fest.description}
                        </p>

                        <div className="space-y-2 text-xs text-text-secondary mb-3">
                          <p className="flex items-center gap-1">
                            <Icons.Calendar className="h-3 w-3" />
                            {new Date(fest.start_date).toLocaleDateString()} -{" "}
                            {new Date(fest.end_date).toLocaleDateString()}
                          </p>
                          {fest.location && (
                            <p className="flex items-center gap-1">
                              <Icons.MapPin className="h-3 w-3" />
                              {fest.location}
                            </p>
                          )}
                        </div>

                        {isLeader(fest) && (
                          <div className="pt-2 border-t border-border-default">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              You're the organizer
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
