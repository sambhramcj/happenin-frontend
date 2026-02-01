"use client";

import { useState } from "react";
import { Download, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface BulkCertificateGeneratorProps {
  eventId: string;
  templateExists: boolean;
}

interface GenerationStatus {
  name: string;
  status: "pending" | "generating" | "success" | "error";
  error?: string;
  downloadUrl?: string;
}

export default function BulkCertificateGenerator({ eventId, templateExists }: BulkCertificateGeneratorProps) {
  const [studentNames, setStudentNames] = useState<string[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Parse CSV or text input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const names = text
        .split(/[\n,]/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      setStudentNames(names);
      setGenerationStatus(names.map((name) => ({ name, status: "pending" })));
      setError("");
    };
    reader.readAsText(file);
  };

  const handleTextInput = (text: string) => {
    const names = text
      .split(/[\n,]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    setStudentNames(names);
    setGenerationStatus(names.map((name) => ({ name, status: "pending" })));
  };

  // Generate certificates one by one
  const handleGenerate = async () => {
    if (studentNames.length === 0) {
      setError("Please add student names first");
      return;
    }

    if (!templateExists) {
      setError("Please create a certificate template first");
      return;
    }

    setIsGenerating(true);
    setError("");

    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];

      // Update status to generating
      setGenerationStatus((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "generating" } : s)));

      try {
        const response = await fetch("/api/certificates/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            studentName: name,
            download: false, // We'll handle download manually
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate certificate for ${name}`);
        }

        // Get PDF blob
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        // Update status to success
        setGenerationStatus((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "success", downloadUrl } : s))
        );

        // Auto-download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${name.replace(/\s+/g, "_")}_Certificate.pdf`;
        link.click();
      } catch (err) {
        console.error(`Error generating certificate for ${name}:`, err);
        setGenerationStatus((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "error", error: err instanceof Error ? err.message : "Unknown error" } : s
          )
        );
      }

      // Small delay between generations to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Certificate Generation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Generate certificates for multiple participants</p>
      </div>

      {!templateExists && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">No Certificate Template</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Please create a certificate template first before generating certificates.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Input Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload CSV */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload CSV/Text File</label>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={isGenerating}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Upload student names</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">One name per line or comma-separated</p>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Or Enter Names Manually</label>
          <textarea
            placeholder="Enter student names (one per line or comma-separated)&#10;Example:&#10;John Doe&#10;Jane Smith&#10;Bob Johnson"
            rows={4}
            onChange={(e) => handleTextInput(e.target.value)}
            disabled={isGenerating}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Student Names Preview */}
      {studentNames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Students ({studentNames.length})
            </h4>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !templateExists}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate All Certificates
                </>
              )}
            </button>
          </div>

          {/* Status List */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {generationStatus.map((status, index) => (
              <div key={index} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">{status.name}</span>
                <div className="flex items-center gap-2">
                  {status.status === "pending" && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
                  )}
                  {status.status === "generating" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">Generating...</span>
                    </>
                  )}
                  {status.status === "success" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">Generated</span>
                      {status.downloadUrl && (
                        <a
                          href={status.downloadUrl}
                          download={`${status.name.replace(/\s+/g, "_")}_Certificate.pdf`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </>
                  )}
                  {status.status === "error" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {studentNames.length === 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">How to use:</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>Upload a CSV/text file or enter names manually</li>
            <li>Review the list of students</li>
            <li>Click "Generate All Certificates" to start</li>
            <li>Certificates will be downloaded automatically</li>
          </ol>
        </div>
      )}
    </div>
  );
}
