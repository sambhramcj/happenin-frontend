"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  eventId: string;
  onScan: (qrData: string) => Promise<void>;
}

export default function QRScanner({ eventId, onScan }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      // 1. Create scanner instance targeting div with id "qr-reader"
      const qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = qrcode;

      // 2. Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      };

      // 3. Start camera and scan
      await qrcode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        config,
        async (decodedText) => {
          // Called when QR detected
          try {
            await onScan(decodedText);
          } catch (err) {
            toast.error("Failed to process scan");
          }
        },
        () => {
          // Scan failed - ignore
        }
      );

      setScanning(true);
      toast.success("Camera started - scan QR code");
    } catch (err) {
      console.error("Scanner start error:", err);
      toast.error("Failed to start camera");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        setScanning(false);
        toast.success("Scanner stopped");
      }
    } catch (err) {
      console.error("Scanner stop error:", err);
      toast.error("Failed to stop scanner");
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Video Container */}
      {scanning ? (
        <div id="qr-reader" className="w-full bg-black rounded-lg overflow-hidden" />
      ) : (
        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-600">Camera not active</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            📷 Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            ⏹️ Stop Scanner
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center">
        {scanning
          ? "Point camera at QR code to scan"
          : "Click Start to activate camera"}
      </p>
    </div>
  );
}
