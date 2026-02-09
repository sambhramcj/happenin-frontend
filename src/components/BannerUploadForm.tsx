"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import Image from "next/image";

const UPLOAD_RULES = [
  "Recommended Size: 1600 × 500 pixels (16:5 ratio)",
  "Minimum Size: 1200 × 375 pixels",
  "Maximum File Size: 2MB",
  "Allowed Formats: JPG, PNG, WebP",
  "Maximum 2 lines of text inside banner image",
  "No QR codes or misleading CTAs",
  "No external URLs embedded in image",
];

const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface BannerUploadFormProps {
  bannerType: "event" | "sponsor";
  eventId?: string;
  festId?: string;
  sponsorEmail?: string | null;
  sponsorshipDealId?: string;
  allowedPlacements?: Array<"home_top" | "home_mid" | "event_page">;
  linkUrl?: string;
  onSuccess?: (banner: any) => void;
}

export function BannerUploadForm({
  bannerType,
  eventId,
  festId,
  sponsorEmail,
  sponsorshipDealId,
  allowedPlacements,
  linkUrl,
  onSuccess,
}: BannerUploadFormProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [placement, setPlacement] = useState<"home_top" | "home_mid" | "event_page">(
    allowedPlacements?.[0] || "home_top"
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error("Only JPG, PNG, and WebP formats are allowed");
      return;
    }

    // Validate file size
    if (selectedFile.size > FILE_SIZE_LIMIT) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    if (!eventId && !sponsorEmail) {
      toast.error("Missing event or sponsor information");
      return;
    }

    if (bannerType === "sponsor" && !sponsorshipDealId) {
      toast.error("Missing sponsorship deal information");
      return;
    }

    if (bannerType === "sponsor" && !linkUrl) {
      toast.error("Sponsor website URL is required for banner links");
      return;
    }

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const filename = `${bannerType}-${timestamp}-${Math.random().toString(36).slice(2, 9)}`;
      const storagePath = `banners/${filename}`;

      const { data: uploadData, error: uploadError } = await fetch(
        `/api/upload?bucket=promotions&path=${storagePath}`,
        {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        }
      ).then((r) => r.json());

      if (uploadError) {
        throw new Error(uploadError);
      }

      // Create banner record
      const { data, error } = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: bannerType,
          eventId: bannerType === "event" ? eventId : undefined,
          festId: bannerType === "sponsor" ? festId : undefined,
          sponsorEmail: bannerType === "sponsor" ? sponsorEmail : undefined,
          imageUrl: uploadData.publicUrl,
          placement,
          sponsorshipDealId: bannerType === "sponsor" ? sponsorshipDealId : undefined,
          linkType: bannerType === "event" ? "internal_event" : "external_url",
          linkTargetId: bannerType === "event" ? eventId : undefined,
          linkUrl: bannerType === "sponsor" ? linkUrl : undefined,
          startDate: new Date().toISOString(),
        }),
      }).then((r) => r.json());

      if (error) {
        throw new Error(error);
      }

      toast.success("Banner submitted for approval");
      setTitle("");
      setFile(null);
      setPreview("");

      onSuccess?.(data);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 bg-bg-card rounded-xl border border-border-default p-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Upload Promotional Banner
        </h3>
        <p className="text-sm text-text-secondary">
          Add a banner to promote {bannerType === "event" ? "your event" : "your sponsorship"}
        </p>
      </div>

      {/* Upload Rules */}
      {showRules && (
        <div className="bg-bg-primary border border-border-default rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-text-primary">Upload Rules</h4>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="p-1 hover:bg-bg-muted rounded transition-colors"
            >
              <Icons.X className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            {UPLOAD_RULES.map((rule, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Banner Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., TechFest 2024"
          className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {allowedPlacements && allowedPlacements.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Placement
          </label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as "home_top" | "home_mid" | "event_page")}
            className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-text-primary"
          >
            {allowedPlacements.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Banner Image
        </label>
        <div className="relative border-2 border-dashed border-border-default rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center gap-2">
            <Icons.Upload className="h-8 w-8 text-text-muted group-hover:text-primary transition-colors" />
            <p className="text-sm font-medium text-text-primary">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-text-secondary">
              JPG, PNG or WebP (max 2MB)
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Preview
          </label>
          <div className="relative w-full bg-bg-primary rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Banner preview"
              width={1600}
              height={500}
              className="w-full h-auto object-cover"
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            <strong>Note:</strong> This banner appears only after admin approval and verified sponsorship visibility.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUpload}
        disabled={!file || !title.trim() || uploading}
        className="w-full py-2 px-4 bg-primary text-text-inverse rounded-lg font-medium hover:bg-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Icons.Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Icons.Upload className="h-4 w-4" />
            Submit for Approval
          </>
        )}
      </button>

      <p className="text-xs text-text-muted text-center">
        Your banner will be reviewed and approved by our team within 24 hours
      </p>
    </div>
  );
}
