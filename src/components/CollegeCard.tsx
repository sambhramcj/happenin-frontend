'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { addFavoriteCollege, removeFavoriteCollege } from '@/lib/geolocation';
import { Icons } from './icons';

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface CollegeCardProps {
  college: College;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function CollegeCard({ college, isFavorite = false, onFavoriteToggle }: CollegeCardProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    if (!session?.user?.email) {
      toast.error('Please log in to add favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await removeFavoriteCollege(session.user.email, college.id);
        toast.success('Removed from favorites');
      } else {
        await addFavoriteCollege(session.user.email, college.id);
        toast.success('Added to favorites');
      }
      onFavoriteToggle?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-default hover:border-primary transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">{college.name}</h3>
          <p className="text-sm text-text-muted flex items-center gap-1">
            <Icons.MapPin className="h-4 w-4" />
            {college.city}, {college.state}
          </p>
        </div>
        <button
          onClick={handleFavoriteToggle}
          disabled={loading}
          className={`p-2 rounded-full transition-colors ${
            isFavorite 
              ? 'bg-red-500/20 text-red-500' 
              : 'bg-bg-muted text-text-muted hover:bg-bg-elevated'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isFavorite ? (
            <Icons.Heart className="h-5 w-5 fill-current" />
          ) : (
            <Icons.Heart className="h-5 w-5" />
          )}
        </button>
      </div>

      {college.distance !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <Icons.Navigation className="h-4 w-4 text-primary" />
          <span className="text-text-secondary">
            {college.distance < 1 
              ? `${Math.round(college.distance * 1000)}m away`
              : `${college.distance.toFixed(1)}km away`
            }
          </span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border-default">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${college.latitude},${college.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Icons.ExternalLink className="h-4 w-4" />
          View on Maps
        </a>
      </div>
    </div>
  );
}
