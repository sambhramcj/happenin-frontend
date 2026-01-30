"use client";

import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface SocialShareProps {
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventLocation: string;
  eventId: string;
}

export function SocialShareButton({
  eventTitle,
  eventDescription,
  eventDate,
  eventLocation,
  eventId,
}: SocialShareProps) {
  const eventUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${eventId}`;
  const shareText = `Check out ${eventTitle} on ${eventDate} at ${eventLocation}! Join me on Happenin 🎉`;

  const handleShare = (platform: "whatsapp" | "instagram" | "snapchat" | "twitter" | "facebook") => {
    let url = "";

    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + eventUrl)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct sharing via URL, show instructions
        toast.info(
          "Copy the event link and share it on Instagram Stories or Direct Messages"
        );
        navigator.clipboard.writeText(eventUrl);
        return;
      case "snapchat":
        // Snapchat share
        url = `https://www.snapchat.com/scan/?attachmentUrl=${encodeURIComponent(eventUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        break;
    }

    if (url) {
      window.open(url, "share", "width=600,height=400");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">Share:</span>
      <button
        onClick={() => handleShare("whatsapp")}
        className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
        title="Share on WhatsApp"
      >
        <Icons.Share2 className="h-5 w-5 text-green-500" />
      </button>
      <button
        onClick={() => handleShare("instagram")}
        className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
        title="Share on Instagram"
      >
        <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.645.069-4.849.069-3.204 0-3.584-.012-4.849-.069-3.259-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
        </svg>
      </button>
      <button
        onClick={() => handleShare("snapchat")}
        className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
        title="Share on Snapchat"
      >
        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z" />
        </svg>
      </button>
      <button
        onClick={() => handleShare("twitter")}
        className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
        title="Share on Twitter"
      >
        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 1.6 1-3.7a4.5 4.5 0 00-6.7-4z" />
        </svg>
      </button>
      <button
        onClick={() => handleShare("facebook")}
        className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
        title="Share on Facebook"
      >
        <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
    </div>
  );
}
