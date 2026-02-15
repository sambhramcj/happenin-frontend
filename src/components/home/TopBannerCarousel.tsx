"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  redirect_url: string | null;
  title: string | null;
  priority: number;
}

export default function TopBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch("/api/home/banners");
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.redirect_url) {
      window.open(banner.redirect_url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[400px] bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-xl group">
      {/* Banner Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => handleBannerClick(banner)}
            style={{ cursor: banner.redirect_url ? "pointer" : "default" }}
          >
            <Image
              src={banner.image_url}
              alt={banner.title || "Banner"}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
