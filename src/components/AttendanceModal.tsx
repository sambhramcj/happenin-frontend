"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import QRScanner from "./QRScanner";

interface Attendance {
  id: string;
  ticket_id: string;
  registration_id: string;
  student_email: string;
  scanned_at: string;
  organizer_email: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function AttendanceModal({
  isOpen,
  eventId,
  eventTitle,
  onClose,
}: AttendanceModalProps) {
  const [scannerActive, setScannerActive] = useState(true);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  React.useEffect(() => {
    if (isOpen && eventId) {
      fetchAttendance();
    }
  }, [isOpen, eventId]);

  async function fetchAttendance() {
    try {
      setLoadingAttendance(true);
      const res = await fetch(`/api/organizer/attendance/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
        setAttendanceCount(data.attendance?.length || 0);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoadingAttendance(false);
    }
  }

  async function handleQRScanned(qrData: string) {
    try {
      const res = await fetch(`/api/organizer/attendance/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeData: qrData }),
      });

      if (res.ok) {
        toast.success("Attendance marked!");
        setAttendanceCount((prev) => prev + 1);
        fetchAttendance();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to record attendance");
      }
    } catch (err) {
      console.error("Attendance error:", err);
      toast.error("Failed to record attendance");
    }
  }

  async function downloadAttendance() {
    try {
      const csv = [
        ["Email", "Scanned At", "Organizer"],
        ...attendance.map((a) => [
          a.student_email,
          new Date(a.scanned_at).toLocaleString(),
          a.organizer_email,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-${eventId}-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("Attendance downloaded!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download attendance");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f0519] rounded-2xl shadow-2xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#2d1b4e] border-b border-purple-500/30 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-200 mb-1">
              📱 Attendance Scanner
            </h2>
            <p className="text-sm text-purple-400">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-200 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanner Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-200">
                  Scan Tickets
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scannerActive}
                    onChange={(e) => setScannerActive(e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-purple-300">
                    {scannerActive ? "Scanner On" : "Scanner Off"}
                  </span>
                </label>
              </div>

              {scannerActive && (
                <div className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg p-4">
                  <QRScanner eventId={eventId} onScan={handleQRScanned} />
                </div>
              )}

              {!scannerActive && (
                <div className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg p-8 text-center text-purple-400">
                  <p className="text-sm">Scanner disabled. Toggle above to activate.</p>
                </div>
              )}

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 text-sm font-medium">
                  Total Scanned: <span className="text-2xl font-bold">{attendanceCount}</span>
                </p>
              </div>
            </div>

            {/* Attendance List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-200">
                  Attendance Records
                </h3>
                {attendance.length > 0 && (
                  <button
                    onClick={downloadAttendance}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    📥 Download CSV
                  </button>
                )}
              </div>

              {loadingAttendance ? (
                <div className="text-center py-8 text-purple-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                  <p className="text-sm">Loading attendance...</p>
                </div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-12 text-purple-400">
                  <p className="text-sm">No attendance records yet</p>
                </div>
              ) : (
                <div className="bg-[#1a0b2e] border border-purple-500/20 rounded-lg max-h-[500px] overflow-y-auto">
                  <div className="space-y-2 p-3">
                    {attendance.map((record, idx) => (
                      <div
                        key={record.id}
                        className="bg-[#2d1b4e] border border-purple-500/20 rounded p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-purple-300">
                            {idx + 1}. {record.student_email}
                          </span>
                          <span className="text-xs text-purple-500">
                            {new Date(record.scanned_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#2d1b4e] border-t border-purple-500/30 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-purple-300 border border-purple-500/30 rounded-lg hover:border-purple-500 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
