"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Icons } from "@/components/icons";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_target_id: string;
  link_type: string;
  link_url?: string | null;
  events?: { title: string } | null;
  fests?: { title: string } | null;
  type: "fest" | "event" | "sponsor";
}

interface BannerCarouselProps {
  placement: "home_top" | "home_mid" | "event_page";
  maxBanners?: number;
}

export function BannerCarousel({ placement, maxBanners = 3 }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollinterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBanners();
  }, [placement]);

  useEffect(() => {
    if (!isPaused && banners.length > 1) {
      autoScrollinterval.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 4000);

      return () => {
        if (autoScrollinterval.current) {
          clearInterval(autoScrollinterval.current);
        }
      };
    }
  }, [banners, isPaused]);

  const fetchBanners = async () => {
    try {
      const response = await fetch(
        `/api/banners?placement=${placement}&status=approved&limit=${maxBanners}`
      );
      if (response.ok) {
        const { banners: data } = await response.json();
        setBanners(data || []);

        data.forEach((banner: Banner) => {
          fetch(`/api/banners/${banner.id}/track-view`, { method: "POST" });
        });
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner: Banner) => {
    // Track click
    fetch(`/api/banners/${banner.id}/track-click`, { method: "POST" });

    // Navigate based on type
    if (banner.link_type === "internal_event") {
      window.location.href = `/events/${banner.link_target_id}`;
    } else if (banner.link_type === "internal_sponsor") {
      window.location.href = `/sponsor/${banner.link_target_id}`;
    } else if (banner.link_type === "external_url" && banner.link_url) {
      window.open(banner.link_url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full bg-bg-card rounded-xl overflow-hidden border border-border-default"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Image */}
      <div
        className="relative w-full cursor-pointer group"
        style={{ aspectRatio: "16 / 5" }}
        onClick={() => handleBannerClick(currentBanner)}
      >
        <Image
          src={currentBanner.image_url}
          alt={currentBanner.title}
          fill
          className="object-cover group-hover:opacity-95 transition-opacity"
          priority
        />
        <div className="absolute inset-0 bg-bg-card/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {currentBanner.type === "sponsor" && (
          <div className="absolute left-3 top-3 bg-bg-card/90 border border-border-default text-text-primary text-xs font-medium px-3 py-1 rounded-full">
            {currentBanner.events?.title
              ? `Sponsor of ${currentBanner.events.title}`
              : currentBanner.fests?.title
              ? `Fest Sponsor: ${currentBanner.fests.title}`
              : "Sponsor"}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) =>
                prev === 0 ? banners.length - 1 : prev - 1
              );
            }}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-bg-card/80 border border-border-default transition-colors"
          >
            <Icons.ChevronLeft className="h-5 w-5 text-text-primary" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % banners.length);
            }}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-bg-card/80 border border-border-default transition-colors"
          >
            <Icons.ChevronLeft className="h-5 w-5 text-text-primary rotate-180" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to banner ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-6 bg-text-primary"
                    : "w-2 bg-text-secondary"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
