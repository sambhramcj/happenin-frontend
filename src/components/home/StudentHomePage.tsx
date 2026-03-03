"use client";

import TopBannerCarousel from "@/components/home/TopBannerCarousel";
import TrendingEvents from "@/components/home/TrendingEvents";
import SponsorSpotlight from "@/components/home/SponsorSpotlight";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import FestDiscovery from "@/components/home/FestDiscovery";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import InfiniteEventFeed from "@/components/home/InfiniteEventFeed";

interface StudentHomePageProps {
  profileCollege?: string;
  colleges?: string[];
}

export default function StudentHomePage({}: StudentHomePageProps) {
  const selectedCollege = "all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* 1. Platinum banners */}
        <TopBannerCarousel />

        {/* 2. Normal events */}
        <UpcomingEvents selectedCollege={selectedCollege} />
        <TrendingEvents selectedCollege={selectedCollege} />

        {/* 3. Featured events */}
        <FeaturedEvents selectedCollege={selectedCollege} />

        {/* Remaining discovery blocks */}
        <SponsorSpotlight selectedCollege={selectedCollege} />
        <FestDiscovery selectedCollege={selectedCollege} />

        {/* Personalized feed */}
        <RecommendedForYou selectedCollege={selectedCollege} />

        {/* Final discovery feed */}
        <InfiniteEventFeed selectedCategory="all" selectedCollege={selectedCollege} />
      </div>
    </div>
  );
}
