// Hook: useEventSchedule
// Purpose: Manage multi-day event scheduling with per-day timeline

import { useState } from 'react';

export interface ScheduleSession {
  date: string; // "2026-02-10"
  start_time: string; // "14:00"
  end_time: string; // "20:00"
  description: string; // Activity description
}

export interface EventSchedule {
  start_datetime: string; // ISO 8601
  end_datetime: string; // ISO 8601
  schedule_sessions: ScheduleSession[] | null;
}

export function useEventSchedule() {
  const [eventType, setEventType] = useState<'single-day' | 'multi-day'>('single-day');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([]);

  // For single-day events
  const setSingleDayEvent = (date: string, startTime: string, endTime: string) => {
    const startDT = `${date}T${startTime}:00Z`;
    const endDT = `${date}T${endTime}:00Z`;
    setStartDateTime(startDT);
    setEndDateTime(endDT);
    setScheduleSessions([]);
  };

  // For multi-day events
  const addScheduleSession = (session: ScheduleSession) => {
    const newSessions = [...scheduleSessions, session];
    setScheduleSessions(newSessions);
    
    // Auto-update start/end datetime based on all sessions
    if (newSessions.length > 0) {
      const dates = newSessions.map(s => s.date).sort();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const firstSession = newSessions.find(s => s.date === firstDate)!;
      const lastSession = newSessions.find(s => s.date === lastDate)!;
      
      setStartDateTime(`${firstDate}T${firstSession.start_time}:00Z`);
      setEndDateTime(`${lastDate}T${lastSession.end_time}:00Z`);
    }
  };

  // Update specific session
  const updateScheduleSession = (index: number, session: ScheduleSession) => {
    const newSessions = [...scheduleSessions];
    newSessions[index] = session;
    setScheduleSessions(newSessions);
    
    // Recalculate start/end datetime
    if (newSessions.length > 0) {
      const dates = newSessions.map(s => s.date).sort();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const firstSession = newSessions.find(s => s.date === firstDate)!;
      const lastSession = newSessions.find(s => s.date === lastDate)!;
      
      setStartDateTime(`${firstDate}T${firstSession.start_time}:00Z`);
      setEndDateTime(`${lastDate}T${lastSession.end_time}:00Z`);
    }
  };

  // Remove session
  const removeScheduleSession = (index: number) => {
    const newSessions = scheduleSessions.filter((_, i) => i !== index);
    setScheduleSessions(newSessions);
    
    if (newSessions.length > 0) {
      const dates = newSessions.map(s => s.date).sort();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const firstSession = newSessions.find(s => s.date === firstDate)!;
      const lastSession = newSessions.find(s => s.date === lastDate)!;
      
      setStartDateTime(`${firstDate}T${firstSession.start_time}:00Z`);
      setEndDateTime(`${lastDate}T${lastSession.end_time}:00Z`);
    }
  };

  // Get event schedule data for API
  const getEventScheduleData = (): EventSchedule => ({
    start_datetime: startDateTime,
    end_datetime: endDateTime,
    schedule_sessions: eventType === 'multi-day' && scheduleSessions.length > 0 ? scheduleSessions : null,
  });

  // Calculate total event duration in hours
  const getTotalDurationHours = (): number => {
    if (!startDateTime || !endDateTime) return 0;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  return {
    eventType,
    setEventType,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
    scheduleSessions,
    addScheduleSession,
    updateScheduleSession,
    removeScheduleSession,
    setSingleDayEvent,
    getEventScheduleData,
    getTotalDurationHours,
  };
}
