"use client";

import { Icons } from "@/components/icons";

interface BannerStatusProps {
  status: "pending" | "approved" | "rejected";
  views?: number;
  clicks?: number;
}

export function BannerStatus({ status, views = 0, clicks = 0 }: BannerStatusProps) {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-600",
      label: "Pending Review",
      icon: Icons.Clock,
    },
    approved: {
      bg: "bg-green-500/10",
      text: "text-green-600",
      label: "Approved",
      icon: Icons.Check,
    },
    rejected: {
      bg: "bg-red-500/10",
      text: "text-red-600",
      label: "Rejected",
      icon: Icons.X,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {status === "approved" && (
        <div className="text-xs text-text-secondary space-y-1">
          <div>Views: {views.toLocaleString()}</div>
          <div>Clicks: {clicks.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
