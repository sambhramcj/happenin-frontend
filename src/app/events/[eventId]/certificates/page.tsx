"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CertificateTemplateEditor from "@/components/CertificateTemplateEditor";
import BulkCertificateGenerator from "@/components/BulkCertificateGenerator";
import { Award, Settings, Users } from "lucide-react";

/**
 * Example integration page for certificate generation
 * Path: /events/[eventId]/certificates
 * 
 * This shows how to integrate the certificate system into your event dashboard
 */
export default function EventCertificatesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [activeTab, setActiveTab] = useState<"setup" | "generate">("setup");
  const [templateExists, setTemplateExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if template exists on mount
  useEffect(() => {
    async function checkTemplate() {
      try {
        const response = await fetch(`/api/certificates/generate?eventId=${eventId}`);
        const data = await response.json();
        setTemplateExists(data.exists);

        // If template exists, show generate tab by default
        if (data.exists) {
          setActiveTab("generate");
        }
      } catch (error) {
        console.error("Failed to check template:", error);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      checkTemplate();
    }
  }, [eventId]);

  const handleTemplateSaved = () => {
    setTemplateExists(true);
    setActiveTab("generate");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Certificates</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create and generate certificates for event participants
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("setup")}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "setup"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Settings className="h-4 w-4" />
            Template Setup
            {!templateExists && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                Required
              </span>
            )}
            {templateExists && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                ✓
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("generate")}
            disabled={!templateExists}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "generate"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            <Users className="h-4 w-4" />
            Generate Certificates
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === "setup" && (
            <CertificateTemplateEditor eventId={eventId} onSave={handleTemplateSaved} />
          )}

          {activeTab === "generate" && (
            <BulkCertificateGenerator eventId={eventId} templateExists={templateExists} />
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">How it works</h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                <strong>Upload your certificate PDF:</strong> Design your certificate in Canva/Photoshop, export as
                PDF, and upload here
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                <strong>Position the name:</strong> Drag the "STUDENT NAME" placeholder to where participant names
                should appear
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                <strong>Customize font:</strong> Choose from 100+ Google Fonts, adjust size, color, and alignment
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>
                <strong>Generate certificates:</strong> Upload a list of participant names or enter manually, then
                generate all certificates at once
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
