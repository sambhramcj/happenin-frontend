// Component: ExcelUploadHandler
// Purpose: Upload Excel file with recipient names and emails

'use client';

import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface Recipient {
  name: string;
  email: string;
  valid: boolean;
}

interface UploadStats {
  totalRecipients: number;
  validRecipients: number;
  invalidRecipients: number;
}

interface ExcelUploadProps {
  templateId: string;
  onUploadSuccess: (recipients: Recipient[], stats: UploadStats) => void;
  onUploadError?: (error: string) => void;
}

export default function ExcelUploadHandler({
  templateId,
  onUploadSuccess,
  onUploadError,
}: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<{
    recipients: Recipient[];
    stats: UploadStats;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !templateId) {
      onUploadError?.('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateId', templateId);

      const response = await fetch('/api/organizer/certificate-template/upload-recipients', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadedData({
        recipients: result.recipients,
        stats: {
          totalRecipients: result.stats.totalRecipients,
          validRecipients: result.stats.validRecipients,
          invalidRecipients: result.stats.invalidRecipients,
        },
      });

      onUploadSuccess(result.recipients, result.stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">Drag Excel file here</p>
        <p className="text-sm text-gray-600 mb-4">or click to browse</p>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="cursor-pointer">
          <button
            type="button"
            onClick={() => document.getElementById('excel-upload')?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose File
          </button>
        </label>

        {file && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Selected:</strong> {file.name}
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !uploadedData && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Upload Recipients'}
        </button>
      )}

      {/* Upload Results */}
      {uploadedData && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {uploadedData.stats.totalRecipients}
              </p>
              <p className="text-sm text-gray-600">Total Recipients</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {uploadedData.stats.validRecipients}
              </p>
              <p className="text-sm text-gray-600">Valid</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-2xl font-bold text-red-600">
                {uploadedData.stats.invalidRecipients}
              </p>
              <p className="text-sm text-gray-600">Invalid</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadedData.recipients.slice(0, 10).map((recipient, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{recipient.name}</td>
                    <td className="px-4 py-3 text-gray-600">{recipient.email}</td>
                    <td className="px-4 py-3 text-center">
                      {recipient.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-600 inline" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {uploadedData.recipients.length > 10 && (
            <p className="text-sm text-gray-600 text-center">
              ... and {uploadedData.recipients.length - 10} more recipients
            </p>
          )}

          {/* Change Button */}
          <button
            onClick={() => {
              setFile(null);
              setUploadedData(null);
            }}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change File
          </button>
        </div>
      )}
    </div>
  );
}
