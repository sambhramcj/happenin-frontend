"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import Image from "next/image";
import { BannerStatus } from "@/components/BannerStatus";

interface Banner {
  id: string;
  title: string;
  type: "fest" | "event" | "sponsor";
  image_url: string;
  status: "pending" | "approved" | "rejected";
  created_by: string;
  created_at: string;
  views_count: number;
  clicks_count: number;
  priority: number;
}

export function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    fetchBanners();
  }, [filter]);

  const fetchBanners = async () => {
    try {
      const url =
        filter === "pending"
          ? "/api/banners?status=pending"
          : "/api/banners?limit=100";

      const response = await fetch(url);
      if (response.ok) {
        const { banners: data } = await response.json();
        setBanners(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/banners/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (response.ok) {
        toast.success("Banner approved");
        fetchBanners();
      }
    } catch (error) {
      console.error("Failed to approve banner:", error);
      toast.error("Failed to approve banner");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/banners/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (response.ok) {
        toast.success("Banner rejected");
        fetchBanners();
      }
    } catch (error) {
      console.error("Failed to reject banner:", error);
      toast.error("Failed to reject banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;

    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Banner deleted");
        fetchBanners();
      }
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "pending"
              ? "bg-primary text-white"
              : "bg-bg-muted text-text-secondary hover:bg-bg-card"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-bg-muted text-text-secondary hover:bg-bg-card"
          }`}
        >
          All Banners
        </button>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div className="text-center py-12 bg-bg-card rounded-xl border border-border-default">
          <Icons.Image className="h-12 w-12 mx-auto text-text-muted mb-3 opacity-50" />
          <p className="text-text-muted">
            {filter === "pending" ? "No pending banners" : "No banners found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-bg-card rounded-xl border border-border-default overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                {/* Thumbnail */}
                <div className="relative bg-bg-primary rounded-lg overflow-hidden aspect-video md:col-span-1">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {banner.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      <span className="inline-block px-2 py-1 bg-bg-muted rounded mr-2 capitalize">
                        {banner.type}
                      </span>
                      <span className="text-text-muted">
                        by {banner.created_by}
                      </span>
                    </p>
                  </div>

                  <BannerStatus
                    status={banner.status}
                    views={banner.views_count}
                    clicks={banner.clicks_count}
                  />

                  {/* Actions */}
                  {banner.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(banner.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors font-medium text-sm"
                      >
                        <Icons.Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(banner.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm"
                      >
                        <Icons.X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {banner.status !== "pending" && (
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
