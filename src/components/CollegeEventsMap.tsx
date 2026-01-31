"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";

type EventLocation = {
  id: string;
  title: string;
  college: string;
  latitude: number;
  longitude: number;
  date: string;
  price: string;
};

type CollegeEventsMapProps = {
  events: EventLocation[];
  onEventClick?: (eventId: string) => void;
};

export function CollegeEventsMap({ events, onEventClick }: CollegeEventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventLocation | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Set up global handler for event clicks from map popup
    if (onEventClick) {
      (window as any).handleMapEventClick = (eventId: string) => {
        onEventClick(eventId);
      };
    }

    // Load Leaflet dynamically (only on client)
    import("leaflet").then((L) => {
      // Fix Leaflet icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Create map centered on India
      const mapInstance = L.map(mapRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstance);

      // Group events by college
      const collegeMap = new Map<string, EventLocation[]>();
      events.forEach((event) => {
        if (event.latitude && event.longitude) {
          const key = `${event.college}-${event.latitude}-${event.longitude}`;
          if (!collegeMap.has(key)) {
            collegeMap.set(key, []);
          }
          collegeMap.get(key)!.push(event);
        }
      });

      // Add markers for each college with events
      collegeMap.forEach((collegeEvents, key) => {
        const firstEvent = collegeEvents[0];
        
        // Custom marker with event count
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div class="flex flex-col items-center">
              <div class="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                ${collegeEvents.length}
              </div>
              <div class="text-xs mt-1 font-semibold text-purple-700 bg-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                ${firstEvent.college}
              </div>
            </div>
          `,
          iconSize: [80, 60],
          iconAnchor: [40, 60],
        });

        const marker = L.marker([firstEvent.latitude, firstEvent.longitude], {
          icon: customIcon,
        }).addTo(mapInstance);

        // Create popup with all events at this college
        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-gray-900 mb-2">${firstEvent.college}</h3>
            <p class="text-sm text-gray-600 mb-2">${collegeEvents.length} event${collegeEvents.length > 1 ? "s" : ""}</p>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              ${collegeEvents
                .map(
                  (event) => `
                <div class="border-t pt-2 cursor-pointer hover:bg-gray-50 p-1 rounded" onclick="${onEventClick ? `window.handleMapEventClick('${event.id}')` : `window.location.href='/events/${event.id}'`}">
                  <p class="font-semibold text-sm text-gray-900">${event.title}</p>
                  <p class="text-xs text-gray-500">${new Date(event.date).toLocaleDateString()}</p>
                  <p class="text-xs font-semibold text-purple-600">₹${event.price}</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
        });

        // Click handler
        marker.on("click", () => {
          setSelectedEvent(firstEvent);
        });
      });

      setMap(mapInstance);

      return () => {
        mapInstance.remove();
        // Clean up global handler
        if (onEventClick) {
          delete (window as any).handleMapEventClick;
        }
      };
    });
  }, [events, onEventClick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Icons.MapPin className="h-5 w-5 text-primary" />
          Events by College
        </h2>
        <p className="text-sm text-text-muted">
          {events.length} events across {new Set(events.map((e) => e.college)).size} colleges
        </p>
      </div>
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="h-96 rounded-xl overflow-hidden border-2 border-border-default shadow-lg"
        />
        
        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card/90 rounded-xl">
            <div className="text-center">
              <Icons.MapPin className="h-12 w-12 text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary">No events with location data available</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #f9fafb;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}
