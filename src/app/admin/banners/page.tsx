"use client";

import { BannerManagement } from "@/components/BannerManagement";

export default function AdminBannersPage() {
  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Manage Banners</h1>
          <p className="text-text-secondary mt-1">
            Review and approve promotional banners from organizers and sponsors
          </p>
        </div>

        <BannerManagement />
      </div>
    </div>
  );
}
