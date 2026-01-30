"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

interface FestCreateProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function FestCreate({ onSuccess, onClose }: FestCreateProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setBannerImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadBannerImage = async (): Promise<string | null> => {
    if (!bannerImage) return null;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", bannerImage);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      return data.imageUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      let bannerImageUrl: string | null = null;
      if (bannerImage) {
        bannerImageUrl = await uploadBannerImage();
      }

      const res = await fetch("/api/fests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location,
          bannerImage: bannerImageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create fest");
      }

      toast.success("Fest created successfully!");
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
      });
      setBannerImage(null);
      setBannerPreview("");

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create fest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Icons.Flame className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-text-primary">Create New Fest</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fest Title */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">
            Fest Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., TechFest 2026"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            rows={3}
            placeholder="Describe your fest..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-2 block">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-2 block">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., Main Campus"
          />
        </div>

        {/* Banner Image */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">
            Banner Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-text-inverse hover:file:bg-primaryHover transition-all duration-fast ease-standard"
          />
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Preview"
              className="mt-2 h-40 w-full object-cover rounded-lg"
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-text-inverse py-2 rounded-lg hover:from-primaryHover hover:to-pink-600 transition-all font-medium disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Fest"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-muted text-text-primary rounded-lg hover:bg-border-default transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
