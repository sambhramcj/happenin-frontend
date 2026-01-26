"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Icons } from "./icons";

interface Photo {
  id: string;
  event_id: string;
  event_title: string;
  photo_url: string;
  caption?: string;
  uploaded_at: string;
}

export default function FindMyPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  async function searchPhotos() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/photos/me");
      const data = await res.json();
      
      if (data.success) {
        setPhotos(data.data);
        if (data.data.length === 0) {
          toast.info("No photos found. Face recognition is being processed for recent events.");
        } else {
          toast.success(`Found ${data.data.length} photo(s) with you!`);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search photos");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPhoto(photoUrl: string, photoId: string) {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `happenin-photo-${photoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Photo downloaded!");
    } catch (error) {
      toast.error("Failed to download photo");
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-lg p-6 border border-border-default">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Icons.Search className="h-5 w-5 text-primary" />
          Find My Event Photos
        </h3>
        
        <p className="text-text-muted mb-4">
          Search for photos from events you've attended where you might appear. 
          Our AI will scan event photos to find matches with your profile picture.
        </p>

        <button
          onClick={searchPhotos}
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Searching...
            </>
          ) : (
            <>
              <Icons.Search className="h-5 w-5" />
              Search My Photos
            </>
          )}
        </button>
      </div>

      {photos.length > 0 && (
        <div className="bg-bg-card rounded-lg p-6 border border-border-default">
          <h4 className="text-lg font-bold text-text-primary mb-4">
            Found {photos.length} Photo(s)
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border border-border-default hover:border-primary transition-all"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.event_title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-semibold truncate">
                    {photo.event_title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              alt={selectedPhoto.event_title}
              className="w-full max-h-[70vh] object-contain"
            />

            <div className="p-4 border-t border-border-default">
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {selectedPhoto.event_title}
              </h3>
              {selectedPhoto.caption && (
                <p className="text-text-secondary mb-2">{selectedPhoto.caption}</p>
              )}
              <p className="text-sm text-text-muted mb-4">
                {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
              </p>

              <button
                onClick={() => downloadPhoto(selectedPhoto.photo_url, selectedPhoto.id)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Icons.Download className="h-5 w-5" />
                Download Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
