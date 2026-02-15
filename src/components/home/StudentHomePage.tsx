"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TopBannerCarousel from "@/components/home/TopBannerCarousel";
import TrendingEvents from "@/components/home/TrendingEvents";
import SponsorSpotlight from "@/components/home/SponsorSpotlight";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import FestDiscovery from "@/components/home/FestDiscovery";
import CategoryStrip from "@/components/home/CategoryStrip";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import InfiniteEventFeed from "@/components/home/InfiniteEventFeed";

interface StudentHomePageProps {
  profileCollege?: string;
  colleges?: string[];
}

export default function StudentHomePage({ profileCollege, colleges = [] }: StudentHomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCollege, setSelectedCollege] = useState<string>(profileCollege || "all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayCollegeName = selectedCollege === "all" ? "All Colleges" : selectedCollege;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* College Selector Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Feed</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Discover events happening around you</p>
            </div>
            
            {/* College Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {displayCollegeName}
                </span>
                <ChevronDown className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedCollege("all");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedCollege === "all" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    All Colleges
                  </button>
                  {colleges.map((college) => (
                    <button
                      key={college}
                      onClick={() => {
                        setSelectedCollege(college);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm ${
                        selectedCollege === college ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {college}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* 1. Top Banner Carousel (Hero) */}
        <TopBannerCarousel />

        {/* 2. Trending Now (Top 5 events by registrations) */}
        <TrendingEvents selectedCollege={selectedCollege} />

        {/* 3. Sponsor Spotlight */}
        <SponsorSpotlight selectedCollege={selectedCollege} />

        {/* 4. Featured Events (Boosted Visibility) */}
        <FeaturedEvents selectedCollege={selectedCollege} />

        {/* 5. Fest Discovery Block */}
        <FestDiscovery selectedCollege={selectedCollege} />

        {/* 6. Global Event Category Strip */}
        <CategoryStrip
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* 7. Upcoming Events (Horizontal Scroll) */}
        <UpcomingEvents selectedCollege={selectedCollege} />

        {/* 8. Recommended For You */}
        <RecommendedForYou selectedCollege={selectedCollege} />

        {/* 9. Infinite Smart Event Feed */}
        <InfiniteEventFeed 
          selectedCategory={selectedCategory}
          selectedCollege={selectedCollege}
        />
      </div>
    </div>
  );
}
