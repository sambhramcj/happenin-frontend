"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

export function useRealtime({
  table,
  filter,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
  onChange
}: UseRealtimeOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create channel name
    const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`;

    // Subscribe to changes
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter
        },
        (payload: any) => {
          console.log(`Realtime ${payload.eventType}:`, payload);

          // Call appropriate handler
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old);
          }

          // Call generic change handler
          if (onChange) {
            onChange(payload);
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`Realtime subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Failed to connect to realtime channel');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Realtime connection timed out');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup on unmount
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, filter, event, onInsert, onUpdate, onDelete, onChange, supabase]);

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel, supabase]);

  return {
    isConnected,
    error,
    unsubscribe
  };
}

// Specific hooks for common use cases

export function useEventRegistrations(eventId: string, onNewRegistration?: (registration: any) => void) {
  return useRealtime({
    table: 'registrations',
    filter: `event_id=eq.${eventId}`,
    event: 'INSERT',
    onInsert: onNewRegistration
  });
}

export function useAttendanceUpdates(eventId: string, onAttendanceChange?: (data: any) => void) {
  return useRealtime({
    table: 'attendance',
    filter: `event_id=eq.${eventId}`,
    event: '*',
    onChange: onAttendanceChange
  });
}

export function useEventUpdates(eventId: string, onEventChange?: (event: any) => void) {
  return useRealtime({
    table: 'events',
    filter: `id=eq.${eventId}`,
    event: 'UPDATE',
    onUpdate: onEventChange
  });
}

export function useNotifications(userEmail: string, onNewNotification?: (notification: any) => void) {
  return useRealtime({
    table: 'notifications',
    filter: `recipient_email=eq.${userEmail}`,
    event: 'INSERT',
    onInsert: onNewNotification
  });
}

export function useFestivalSubmissions(festId: string, onSubmissionChange?: (data: any) => void) {
  return useRealtime({
    table: 'festival_submissions',
    filter: `fest_id=eq.${festId}`,
    event: '*',
    onChange: onSubmissionChange
  });
}
