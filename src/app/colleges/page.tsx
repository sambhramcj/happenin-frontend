"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import { CollegeCard } from "@/components/CollegeCard";
import { Skeleton } from "@/components/skeletons";

interface College {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  distance?: number;
}

export default function CollegeBrowsePage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "location">("name");

  useEffect(() => {
    fetchColleges();
  }, []);

  async function fetchColleges() {
    try {
      setLoading(true);
      const res = await fetch("/api/colleges");
      if (res.ok) {
        const data = await res.json();
        setColleges(data.colleges || []);
        setFilteredColleges(data.colleges || []);
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let filtered = colleges.filter((college) =>
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.location.localeCompare(b.location));
    }

    setFilteredColleges(filtered);
  }, [searchQuery, colleges, sortBy]);

  return (
    <div className="min-h-screen bg-bg-muted">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Browse Colleges
          </h1>
          <p className="text-text-secondary mb-4">Discover colleges hosting events near you</p>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Icons.Search className="absolute left-3 top-3 h-5 w-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search colleges or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="location">Sort by Location</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted text-center">Loading events…</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-full" variant="circle" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/2 h-5" variant="text" />
                      <Skeleton className="w-1/3 h-4" variant="text" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="bg-bg-card rounded-xl p-12 text-center border border-border-default">
            <Icons.Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-lg">No colleges found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.map((college) => {
              const normalized = {
                ...college,
                city: college.city || college.location || "",
                state: college.state || "",
              };
              return (
                <div key={college.id} className="h-full">
                  <CollegeCard
                    college={normalized}
                    isFavorite={false}
                    onFavoriteToggle={() => {}}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {filteredColleges.length > 0 && (
          <div className="mt-8 text-center text-text-secondary text-sm">
            Showing {filteredColleges.length} of {colleges.length} colleges
          </div>
        )}
      </div>
    </div>
  );
}
