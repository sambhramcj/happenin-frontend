// Component: CertificatePreviewGallery
// Purpose: Preview generated certificates before sending

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';

interface Certificate {
  studentEmail: string;
  studentName: string;
  certificateUrl: string;
}

interface GalleryProps {
  certificates: Certificate[];
  onConfirmSend: () => void;
  loading?: boolean;
}

export default function CertificatePreviewGallery({
  certificates,
  onConfirmSend,
  loading = false,
}: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No certificates generated yet</p>
      </div>
    );
  }

  const current = certificates[currentIndex];

  const handleNext = () => {
    if (currentIndex < certificates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Preview */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Certificate {currentIndex + 1} of {certificates.length}</h3>
          <div className="text-sm text-gray-600">
            <p>{current.studentName}</p>
            <p className="text-xs text-gray-500">{current.studentEmail}</p>
          </div>
        </div>

        {/* Certificate Image */}
        <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 mb-4" style={{ minHeight: '400px' }}>
          <img
            src={current.certificateUrl}
            alt={`Certificate for ${current.studentName}`}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-300 rounded-full" style={{ minWidth: '200px' }}>
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / certificates.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">{currentIndex + 1}/{certificates.length}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === certificates.length - 1}
            className="p-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <a
            href={current.certificateUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Preview
          </a>
          <button
            onClick={() => window.open(current.certificateUrl, '_blank')}
            className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Full
          </button>
        </div>
      </div>

      {/* Quality Checklist */}
      <div className="border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Quality Checklist</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={false}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm">Name fits in one line</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={false}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm">Quality looks good</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={false}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm">Ready to send</span>
          </label>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={onConfirmSend}
        disabled={loading}
        className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Sending...' : 'Send All Certificates'}
      </button>
    </div>
  );
}
