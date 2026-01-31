"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Icons } from "./icons";

interface EventPhotoUploadProps {
  eventId: string;
  onUploadSuccess?: () => void;
}

export default function EventPhotoUpload({ eventId, onUploadSuccess }: EventPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("caption", caption);

        const res = await fetch(`/api/events/${eventId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
      }

      toast.success(`${selectedFiles.length} photo(s) uploaded successfully!`);
      setSelectedFiles([]);
      setCaption("");
      onUploadSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        file => file.type.startsWith("image/")
      );
      setSelectedFiles(files);
    }
  }

  return (
    <div className="bg-bg-card rounded-lg p-6 border border-border-default">
      <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Icons.Camera className="h-5 w-5 text-primary" />
        Upload Event Photos
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Select Photos
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="w-full px-4 py-2 bg-bg-muted border border-border-default rounded-lg text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer hover:file:bg-primary/90"
          />
          {selectedFiles.length > 0 && (
            <p className="text-sm text-text-muted mt-2">
              {selectedFiles.length} photo(s) selected
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Caption (Optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full px-4 py-2 bg-bg-muted border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Uploading image…" : `Upload ${selectedFiles.length} Photo(s)`}
        </button>
      </div>
    </div>
  );
}
