"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "./icons";

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  uploaded_by: string;
  uploaded_at: string;
  status: "pending" | "approved" | "rejected";
  tags_count?: number;
}

interface EventPhotoGalleryProps {
  eventId: string;
  showModeration?: boolean;
}

export default function EventPhotoGallery({ eventId, showModeration = false }: EventPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [eventId]);

  async function fetchPhotos() {
    try {
      const res = await fetch(`/api/events/${eventId}/photos`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.data);
      }
    } catch (error) {
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }

  async function handleModerate(photoId: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: action === "approve" ? "approved" : "rejected" 
        }),
      });

      if (res.ok) {
        toast.success(`Photo ${action}d successfully`);
        fetchPhotos();
        setSelectedPhoto(null);
      } else {
        throw new Error("Moderation failed");
      }
    } catch (error) {
      toast.error(`Failed to ${action} photo`);
    }
  }

  if (loading) {
    return (
      <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-text-muted mt-2">Loading photos...</p>
      </div>
    );
  }

  const displayPhotos = showModeration 
    ? photos 
    : photos.filter(p => p.status === "approved");

  if (displayPhotos.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
        <Icons.Camera className="h-12 w-12 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border border-border-default hover:border-primary transition-all"
          >
            <img
              src={photo.photo_url}
              alt={photo.caption || "Event photo"}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {showModeration && (
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  photo.status === "approved" 
                    ? "bg-green-500/20 text-green-400"
                    : photo.status === "rejected"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {photo.status}
                </span>
              </div>
            )}
            {photo.tags_count && photo.tags_count > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                <Icons.User className="h-3 w-3" />
                {photo.tags_count}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-bg-card rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icons.X className="h-6 w-6" />
            </button>

            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || "Event photo"}
              className="w-full max-h-[70vh] object-contain"
            />

            <div className="p-4 border-t border-border-default">
              {selectedPhoto.caption && (
                <p className="text-text-primary mb-2">{selectedPhoto.caption}</p>
              )}
              <p className="text-sm text-text-muted">
                Uploaded by {selectedPhoto.uploaded_by} • {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
              </p>

              {showModeration && selectedPhoto.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleModerate(selectedPhoto.id, "approve")}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleModerate(selectedPhoto.id, "reject")}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
