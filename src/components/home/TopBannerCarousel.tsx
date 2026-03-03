"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Banner {
  id: string;
  image_url: string;
  redirect_url: string | null;
  title: string | null;
  priority: number;
}

export default function TopBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

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

  const handleBannerClick = (banner: Banner) => {
    if (banner.redirect_url) {
      window.open(banner.redirect_url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative w-full aspect-[3/2] bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const visibleBanners = banners.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {visibleBanners.map((banner, index) => (
        <div
          key={banner.id}
          onClick={() => handleBannerClick(banner)}
          style={{ cursor: banner.redirect_url ? "pointer" : "default" }}
          className={`relative w-full aspect-[3/2] overflow-hidden rounded-xl ${index > 0 ? "hidden lg:block" : "block"}`}
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
  );
}
