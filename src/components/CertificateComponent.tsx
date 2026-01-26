"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface CertificateProps {
  id: string;
  certificateTitle: string;
  volunteerRole: string;
  eventName: string;
  issuedDate: string;
  issuedBy: string;
}

export default function CertificateComponent({
  id,
  certificateTitle,
  volunteerRole,
  eventName,
  issuedDate,
  issuedBy,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `certificate-${id}.png`;
      link.click();
      toast.success("Certificate downloaded!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="relative w-full bg-gradient-to-br from-purple-50 to-purple-100 border-4 border-purple-600 rounded-lg p-12 shadow-lg"
        style={{
          aspectRatio: "16 / 10",
        }}
      >
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-purple-600" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-purple-600" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-purple-600" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-purple-600" />

        {/* Content */}
        <div className="flex flex-col justify-center items-center h-full text-center space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              Certificate of Appreciation
            </h1>
            <p className="text-purple-500 text-lg">{certificateTitle}</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <p className="text-2xl font-semibold text-gray-800">
              {volunteerRole}
            </p>
            <p className="text-gray-700">
              For volunteerism and dedication at
            </p>
            <p className="text-2xl font-bold text-purple-600">{eventName}</p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center w-full mt-8 px-8">
            <div className="text-left">
              <p className="text-sm text-gray-600">Issued Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(issuedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Issued By</p>
              <p className="font-semibold text-gray-800">{issuedBy}</p>
            </div>
          </div>

          {/* Certificate ID */}
          <p className="text-xs text-gray-500 mt-4">Certificate ID: {id}</p>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
      >
        {downloading ? "Downloading..." : "Download as PNG"}
      </button>
    </motion.div>
  );
}
