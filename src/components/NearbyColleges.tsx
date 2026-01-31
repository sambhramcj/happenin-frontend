'use client';

import { useState, useEffect } from 'react';
import { getNearbyColleges } from '@/lib/geolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CollegeCard } from './CollegeCard';
import { RadiusSelector } from './RadiusSelector';
import { Icons } from './icons';
import { Skeleton } from './skeletons';
import { toast } from 'sonner';

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export function NearbyColleges() {
  const { location, error, loading: geoLoading, permissionDenied } = useGeolocation();
  const [radius, setRadius] = useState(10);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (location) {
      fetchNearbyColleges();
    }
  }, [location, radius]);

  const fetchNearbyColleges = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const nearby = await getNearbyColleges(location.latitude, location.longitude, radius);
      setColleges(nearby);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load nearby colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = () => {
    // Refresh favorites list (you could implement getFavoriteColleges here)
    fetchNearbyColleges();
  };

  if (geoLoading) {
    return (
      <div className="bg-bg-card rounded-xl p-6 border border-border-default">
        <p className="text-sm text-text-muted text-center mb-4">Loading events…</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-muted rounded-lg p-4 border border-border-default">
              <div className="flex gap-3">
                <Skeleton className="w-14 h-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-1/2 h-4" variant="text" />
                  <Skeleton className="w-1/3 h-3" variant="text" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
        <Icons.MapPin className="h-12 w-12 mx-auto mb-4 text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Location Access Required</h3>
        <p className="text-text-muted mb-4">
          Please enable location access in your browser to find nearby colleges.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default border-error">
        <Icons.AlertTriangle className="h-12 w-12 mx-auto mb-4 text-error" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Location Error</h3>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-xl p-6 border border-border-default">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Icons.MapPin className="h-5 w-5 text-primary" />
          Nearby Colleges
        </h2>

        <RadiusSelector value={radius} onChange={setRadius} className="mb-6" />

        {loading ? (
          <div className="space-y-3">
            <p className="text-sm text-text-muted text-center">Loading events…</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-muted rounded-lg p-4 border border-border-default">
                <div className="flex gap-3">
                  <Skeleton className="w-14 h-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/2 h-4" variant="text" />
                    <Skeleton className="w-1/3 h-3" variant="text" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : colleges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleges.map((college) => (
              <CollegeCard
                key={college.id}
                college={college}
                isFavorite={favoriteIds.has(college.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icons.Search className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted">No colleges found within {radius}km</p>
            <button
              onClick={() => setRadius(radius === 50 ? 5 : radius + 10)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try increasing the search radius
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
