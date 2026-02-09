"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import * as QRCode from "qrcode.react";

type TicketDesign = "modern" | "classic" | "minimal" | "colorful";

interface TicketComponentProps {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  studentName: string;
  studentEmail: string;
  qrCodeData: string;
  design?: TicketDesign;
  eventId?: string;
}

export default function TicketComponent({
  ticketId,
  eventTitle,
  eventDate,
  eventLocation,
  studentName,
  studentEmail,
  qrCodeData,
  design = "modern",
  eventId,
}: TicketComponentProps) {
  const [downloading, setDownloading] = useState(false);
  const [sponsor, setSponsor] = useState<{ name: string; logo_url?: string } | null>(null);
  const qrRef = React.useRef<HTMLDivElement>(null);

  // Fetch sponsor for the event
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/sponsorship/public?event_id=${eventId}`);
        if (!res.ok) return;
        const json = await res.json();
        const deals = json.deals || [];
        if (deals.length === 0) return;
        const priority = ["fest", "app", "digital"];
        const chosen = deals.sort((a: any, b: any) => {
          const aRank = priority.indexOf(a?.sponsorship_packages?.type || "");
          const bRank = priority.indexOf(b?.sponsorship_packages?.type || "");
          return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
        })[0];
        const sp = chosen.sponsors_profile || {};
        if (!cancelled) setSponsor({ name: sp.company_name, logo_url: sp.logo_url });
      } catch {}
    }
    run();
    return () => { cancelled = true; };
  }, [eventId]);

  // Download ticket as PNG
  const downloadTicket = async () => {
    if (!qrRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      setDownloading(true);
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `ticket-${ticketId}.png`;
      link.click();
      toast.success("Ticket downloaded!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download ticket");
    } finally {
      setDownloading(false);
    }
  };

  // Design templates for tickets
  const designs = {
    modern: {
      container: "bg-gradient-to-r from-purple-600 to-pink-600",
      bg: "bg-gradient-to-r from-purple-600 to-pink-600",
      text: "text-white",
      accent: "text-purple-100",
    },
    classic: {
      container: "bg-white border-4 border-purple-800",
      bg: "bg-white",
      text: "text-purple-900",
      accent: "text-purple-700",
    },
    minimal: {
      container: "bg-gray-100 border-2 border-gray-800",
      bg: "bg-gray-100",
      text: "text-gray-900",
      accent: "text-gray-700",
    },
    colorful: {
      container: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400",
      bg: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400",
      text: "text-white",
      accent: "text-blue-100",
    },
  };

  const currentDesign = designs[design];

  return (
    <div className="space-y-4">
      {/* Ticket Preview */}
      <div
        ref={qrRef}
        className={`p-8 rounded-xl shadow-lg ${currentDesign.container} w-full`}
        style={{
          aspectRatio: "3/1",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Left: Event Details */}
        <div className="flex-1">
          <h3 className={`text-2xl font-bold ${currentDesign.text} mb-2`}>
            {eventTitle}
          </h3>
          <div className={`space-y-1 ${currentDesign.accent}`}>
            <p className="text-sm font-medium">📅 {eventDate}</p>
            <p className="text-sm font-medium">📍 {eventLocation}</p>
            <p className="text-sm font-medium">👤 {studentName}</p>
            <p className="text-xs font-mono">{studentEmail}</p>
          </div>
          {sponsor && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`${currentDesign.accent} text-[11px]`}>Supported by</span>
              {sponsor.logo_url ? (
                <img src={sponsor.logo_url} alt={sponsor.name} className="h-4 object-contain" />
              ) : (
                <span className={`${currentDesign.text} text-xs font-semibold`}>{sponsor.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Middle: Divider */}
        <div
          className={`w-px h-32 ${
            design === "classic" ? "bg-purple-800" : "bg-white opacity-30"
          }`}
        />

        {/* Right: QR Code */}
        <div className="flex flex-col items-center gap-2">
          <QRCode.QRCodeSVG
            value={qrCodeData}
            size={120}
            level="H"
            includeMargin={true}
            fgColor={design === "classic" ? "#1e1b4b" : "#ffffff"}
            bgColor={
              design === "classic"
                ? "#ffffff"
                : design === "minimal"
                  ? "#f3f4f6"
                  : "transparent"
            }
          />
          <p className={`text-xs font-bold ${currentDesign.text}`}>
            {ticketId}
          </p>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadTicket}
        disabled={downloading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {downloading ? "Downloading..." : "📥 Download as PNG"}
      </button>
    </div>
  );
}
