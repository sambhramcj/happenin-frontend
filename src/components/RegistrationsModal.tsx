import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Skeleton } from "./skeletons";

type Registration = {
  student_email: string;
  final_price: number;
  created_at: string;
};

interface RegistrationsModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationsModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}: RegistrationsModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchRegistrations();
  }, [isOpen, eventId]);

  async function fetchRegistrations() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/organizer/events/${eventId}/registrations`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch registrations");
      }

      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadAsCSV() {
    if (registrations.length === 0) {
      toast.error("No registrations to download");
      return;
    }

    const headers = ["Student Email", "Amount Paid", "Registration Date"];
    const rows = registrations.map((reg) => [
      reg.student_email,
      `₹${reg.final_price}`,
      new Date(reg.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Downloaded as CSV");
  }

  function downloadAsExcel() {
    if (registrations.length === 0) {
      toast.error("No registrations to download");
      return;
    }

    const data = registrations.map((reg) => ({
      "Student Email": reg.student_email,
      "Amount Paid": `₹${reg.final_price}`,
      "Registration Date": new Date(reg.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, `${eventTitle}_registrations.xlsx`);
    toast.success("Downloaded as Excel");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#0f0519] border border-purple-500/30 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-purple-500/20 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-200">Registrations</h2>
            <p className="text-purple-400 text-sm mt-1">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 text-2xl leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm text-purple-300 text-center">Loading events…</p>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
                  <Skeleton className="w-1/2 h-4" variant="text" />
                  <Skeleton className="w-1/3 h-3 mt-2" variant="text" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-purple-300 text-lg">No registrations yet</p>
              <p className="text-purple-400 text-sm mt-2">
                Students who register will appear here
              </p>
            </div>
          ) : (
            <div>
              <p className="text-purple-300 font-semibold mb-4">
                Total Registrations: <span className="text-purple-200">{registrations.length}</span>
              </p>
              <div className="space-y-3">
                {registrations.map((reg, idx) => (
                  <div
                    key={idx}
                    className="bg-[#2d1b4e] border border-purple-500/20 rounded-lg p-4 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-purple-200 font-medium">{reg.student_email}</p>
                        <p className="text-purple-400 text-sm">
                          {new Date(reg.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-300 font-semibold">₹{reg.final_price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {registrations.length > 0 && (
          <div className="border-t border-purple-500/20 p-6 flex gap-3 justify-end">
            <button
              onClick={downloadAsCSV}
              className="bg-purple-600/40 text-purple-200 px-4 py-2 rounded-lg hover:bg-purple-600/60 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
            >
              📥 CSV
            </button>
            <button
              onClick={downloadAsExcel}
              className="bg-purple-600/40 text-purple-200 px-4 py-2 rounded-lg hover:bg-purple-600/60 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
            >
              📥 Excel
            </button>
            <button
              onClick={onClose}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
