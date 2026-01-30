// Component: Certificate Generation Wizard Page
// Purpose: Complete certificate generation flow for organizer

'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import CertificateImageEditor from '@/components/CertificateImageEditor';
import ExcelUploadHandler from '@/components/ExcelUploadHandler';
import CertificatePreviewGallery from '@/components/CertificatePreviewGallery';

interface Step {
  id: number;
  name: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    name: 'Upload Image',
    title: 'Upload Certificate Image',
    description: 'Upload your custom certificate design (JPG, PNG)',
  },
  {
    id: 2,
    name: 'Customize',
    title: 'Customize Name Field',
    description: 'Position and style the name text on certificate',
  },
  {
    id: 3,
    name: 'Recipients',
    title: 'Upload Recipients',
    description: 'Upload Excel file with names and emails',
  },
  {
    id: 4,
    name: 'Generate',
    title: 'Generate Certificates',
    description: 'Generate all certificates from template',
  },
  {
    id: 5,
    name: 'Review',
    title: 'Review & Send',
    description: 'Preview certificates and send to students',
  },
];

interface PageProps {
  eventId: string;
  recipientType: 'volunteer' | 'participant' | 'winner';
}

export default function CertificateGenerationWizard({ eventId, recipientType }: PageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [templateConfig, setTemplateConfig] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [generatedCertificates, setGeneratedCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('eventId', eventId);

      const response = await fetch('/api/organizer/certificate-template/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImageUrl(data.imageUrl);
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateCreate = async (config: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/organizer/certificate-template/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          imageUrl,
          recipientType,
          ...config,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Creation failed');
      }

      setTemplateId(data.templateId);
      setTemplateConfig(config);
      setSuccess('Template created successfully!');
      setCurrentStep(3);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientsUpload = async (uploadedRecipients: any[], stats: any) => {
    setRecipients(uploadedRecipients);
    setSuccess(`${stats.validRecipients} valid recipients loaded!`);
    setCurrentStep(4);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleGenerateCertificates = async () => {
    if (!templateId) {
      setError('No template selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/organizer/certificate-template/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedCertificates(data.certificateUrls);
      setSuccess(`${data.generated} certificates generated successfully!`);
      setCurrentStep(5);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCertificates = async () => {
    if (!templateId) {
      setError('No template selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/organizer/certificate-template/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Send failed');
      }

      setSuccess(`✅ ${data.sent} certificates sent successfully!`);
      // Reset wizard
      setTimeout(() => {
        setCurrentStep(1);
        setTemplateId(null);
        setImageUrl(null);
        setRecipients([]);
        setGeneratedCertificates([]);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎓 Certificate Generation Wizard</h1>
        <p className="text-gray-600">Create and send custom certificates to {recipientType}s</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div key={step.id} className="flex-1">
              {/* Step Circle */}
              <div className="flex items-center justify-center mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                    step.id === currentStep
                      ? 'bg-blue-600 text-white'
                      : step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
              </div>

              {/* Step Name */}
              <p
                className={`text-sm font-medium text-center ${
                  step.id === currentStep
                    ? 'text-blue-600'
                    : step.id < currentStep
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}
              >
                {step.name}
              </p>

              {/* Connector Line */}
              {step.id < STEPS.length && (
                <div className={`h-1 mt-4 ${step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-2">{STEPS[currentStep - 1].title}</h2>
        <p className="text-gray-600 mb-8">{STEPS[currentStep - 1].description}</p>

        {/* Step 1: Upload Image */}
        {currentStep === 1 && (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">🖼️</div>
                <p className="text-lg font-medium mb-2">Click to upload certificate image</p>
                <p className="text-sm text-gray-600">JPG, PNG (Recommended: 1200x800px)</p>
              </label>
            </div>

            {imageUrl && (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">✅ Image uploaded successfully!</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customize */}
        {currentStep === 2 && imageUrl && (
          <CertificateImageEditor imageUrl={imageUrl} onSave={handleTemplateCreate} />
        )}

        {/* Step 3: Recipients */}
        {currentStep === 3 && templateId && (
          <ExcelUploadHandler
            templateId={templateId}
            onUploadSuccess={handleRecipientsUpload}
            onUploadError={(error) => setError(error)}
          />
        )}

        {/* Step 4: Generate */}
        {currentStep === 4 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">⚙️</div>
            <p className="text-lg font-medium mb-8">Ready to generate {recipients.length} certificates?</p>
            <button
              onClick={handleGenerateCertificates}
              disabled={loading}
              className="py-3 px-8 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate All Certificates'}
            </button>
          </div>
        )}

        {/* Step 5: Review & Send */}
        {currentStep === 5 && (
          <div>
            <CertificatePreviewGallery
              certificates={generatedCertificates}
              onConfirmSend={handleSendCertificates}
              loading={loading}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex gap-4 justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="py-2 px-6 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={() => {
              if (currentStep === 1 && imageUrl) {
                setCurrentStep(2);
              } else if (currentStep === 2 && templateId) {
                setCurrentStep(3);
              } else if (currentStep === 3 && recipients.length > 0) {
                setCurrentStep(4);
              }
            }}
            disabled={
              (currentStep === 1 && !imageUrl) ||
              (currentStep === 2 && !templateId) ||
              (currentStep === 3 && recipients.length === 0) ||
              currentStep === 4 ||
              currentStep === 5
            }
            className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
