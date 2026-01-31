'use client';

import { useState, useEffect } from 'react';
import { getNearbyColleges } from '@/lib/geolocation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { RadiusSelector } from './RadiusSelector';
import { Icons } from './icons';
import { Skeleton } from './skeletons';
import { toast } from 'sonner';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  college_id: string;
  organizer_email: string;
  poster_url: string | null;
  registration_fee: number;
  max_registrations: number;
}

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export function NearbyEvents() {
  const { location, error, loading: geoLoading, permissionDenied } = useGeolocation();
  const [radius, setRadius] = useState(10);
  const [events, setEvents] = useState<Event[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      fetchNearbyEvents();
    }
  }, [location, radius]);

  const fetchNearbyEvents = async () => {
    if (!location) return;

    setLoading(true);
    try {
      // Get nearby colleges
      const nearbyColleges = await getNearbyColleges(location.latitude, location.longitude, radius);
      setColleges(nearbyColleges);

      // Fetch events from those colleges
      const collegeIds = nearbyColleges.map(c => c.id);
      if (collegeIds.length > 0) {
        const response = await fetch('/api/events');
        const data = await response.json();
        
        if (data.events) {
          // Filter events by nearby college IDs
          const nearbyEvents = data.events.filter((event: Event) => 
            collegeIds.includes(event.college_id)
          );
          setEvents(nearbyEvents);
        }
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load nearby events');
    } finally {
      setLoading(false);
    }
  };

  if (geoLoading) {
    return (
      <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
        <p className="text-text-muted">Getting your location...</p>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
        <Icons.MapPin className="h-12 w-12 mx-auto mb-4 text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Location Access Required</h3>
        <p className="text-text-muted mb-4">
          Please enable location access to discover events happening near you.
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

  const getCollegeName = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    return college?.name || 'Unknown College';
  };

  const getCollegeDistance = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    return college?.distance;
  };

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-xl p-6 border border-border-default">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Icons.Navigation className="h-5 w-5 text-primary" />
          Events Near You
        </h2>

        <RadiusSelector value={radius} onChange={setRadius} className="mb-6" />

        {loading ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted text-center">Loading events…</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-muted rounded-xl p-4 border border-border-default">
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-2/3 h-4" variant="text" />
                    <Skeleton className="w-full h-4" variant="text" />
                    <Skeleton className="w-1/3 h-3" variant="text" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => {
              const distance = getCollegeDistance(event.college_id);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-bg-muted rounded-xl p-4 hover:bg-bg-elevated transition-colors border border-border-default hover:border-primary"
                >
                  <div className="flex gap-4">
                    {event.poster_url && (
                      <img
                        src={event.poster_url}
                        alt={event.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{event.title}</h3>
                      <p className="text-sm text-text-muted mb-2 line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Icons.Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icons.MapPin className="h-3 w-3" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icons.Building2 className="h-3 w-3" />
                          {getCollegeName(event.college_id)}
                        </span>
                        {distance !== undefined && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Icons.Navigation className="h-3 w-3" />
                            {distance < 1 
                              ? `${Math.round(distance * 1000)}m away`
                              : `${distance.toFixed(1)}km away`
                            }
                          </span>
                        )}
                      </div>
                      {event.registration_fee > 0 && (
                        <div className="mt-2 text-sm font-medium text-text-primary">
                          ₹{event.registration_fee}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icons.Calendar className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted">No events found within {radius}km</p>
            <button
              onClick={() => setRadius(radius === 50 ? 5 : Math.min(radius + 10, 50))}
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
