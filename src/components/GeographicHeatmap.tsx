'use client';

import { useEffect, useState } from 'react';
import { Icons } from './icons';

interface EventLocation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  registrationCount: number;
}

interface GeographicHeatmapProps {
  events: EventLocation[];
}

export function GeographicHeatmap({ events }: GeographicHeatmapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
          <p className="text-text-muted">Loading map...</p>
        </div>
      </div>
    );
  }

  // Group events by state/region for heatmap visualization
  const eventsByRegion = events.reduce((acc: Record<string, number>, event) => {
    const region = `${event.latitude.toFixed(1)},${event.longitude.toFixed(1)}`;
    acc[region] = (acc[region] || 0) + event.registrationCount;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(eventsByRegion), 1);

  const getHeatColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-red-500';
    if (intensity > 0.4) return 'bg-orange-500';
    if (intensity > 0.2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-bg-muted rounded-xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {events.slice(0, 12).map((event) => (
          <div
            key={event.id}
            className="bg-bg-card rounded-lg p-4 border border-border-default hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <Icons.MapPin className="h-5 w-5 text-primary" />
              <span
                className={`h-3 w-3 rounded-full ${getHeatColor(event.registrationCount)}`}
                title={`${event.registrationCount} registrations`}
              />
            </div>
            <h4 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2">
              {event.title}
            </h4>
            <div className="text-xs text-text-muted">
              {event.registrationCount} registrations
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {event.latitude.toFixed(2)}, {event.longitude.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Icons.MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No event location data available</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-text-muted">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-text-muted">High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-text-muted">Very High</span>
        </div>
      </div>
    </div>
  );
}
