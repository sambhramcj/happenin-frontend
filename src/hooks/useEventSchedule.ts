// Hook: useEventSchedule
// Purpose: Manage event date with timeline sessions (from/to/description)

import { useState } from 'react';

export interface ScheduleSession {
  date?: string;
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
  const [eventDate, setEventDate] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([]);

  const toIsoDateTime = (session: ScheduleSession, fallbackDate?: string) => {
    const date = session.date || fallbackDate;
    if (!date || !session.start_time || !session.end_time) return null;
    return {
      start: new Date(`${date}T${session.start_time}:00`),
      end: new Date(`${date}T${session.end_time}:00`),
    };
  };

  const recalculateDateTimes = (
    date: string,
    sessions: ScheduleSession[],
    type: 'single-day' | 'multi-day'
  ) => {
    if (sessions.length === 0) {
      setStartDateTime('');
      setEndDateTime('');
      return;
    }

    if (type === 'single-day' && !date) {
      setStartDateTime('');
      setEndDateTime('');
      return;
    }

    const resolvedSessions = sessions
      .map((session) => toIsoDateTime(session, type === 'single-day' ? date : undefined))
      .filter((value): value is { start: Date; end: Date } => Boolean(value));

    if (resolvedSessions.length === 0) {
      setStartDateTime('');
      setEndDateTime('');
      return;
    }

    const sortedByStart = [...resolvedSessions].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
    const sortedByEnd = [...resolvedSessions].sort(
      (a, b) => a.end.getTime() - b.end.getTime()
    );

    const first = sortedByStart[0];
    const last = sortedByEnd[sortedByEnd.length - 1];
    setStartDateTime(first.start.toISOString());
    setEndDateTime(last.end.toISOString());
  };

  const addScheduleSession = (session: ScheduleSession) => {
    const newSessions = [...scheduleSessions, session];
    setScheduleSessions(newSessions);

    recalculateDateTimes(eventDate, newSessions, eventType);
  };

  const updateScheduleSession = (index: number, session: ScheduleSession) => {
    const newSessions = [...scheduleSessions];
    newSessions[index] = session;
    setScheduleSessions(newSessions);

    recalculateDateTimes(eventDate, newSessions, eventType);
  };

  const removeScheduleSession = (index: number) => {
    const newSessions = scheduleSessions.filter((_, i) => i !== index);
    setScheduleSessions(newSessions);

    recalculateDateTimes(eventDate, newSessions, eventType);
  };

  const setEventDateAndRecalculate = (date: string) => {
    setEventDate(date);
    recalculateDateTimes(date, scheduleSessions, eventType);
  };

  const setEventTypeAndRecalculate = (type: 'single-day' | 'multi-day') => {
    setEventType(type);
    recalculateDateTimes(eventDate, scheduleSessions, type);
  };

  const getEventScheduleData = (): EventSchedule => ({
    start_datetime: startDateTime,
    end_datetime: endDateTime,
    schedule_sessions:
      scheduleSessions.length > 0
        ? scheduleSessions.map((session) => ({
            ...session,
            date: eventType === 'single-day' ? eventDate : session.date,
          }))
        : null,
  });

  const getTotalDurationHours = (): number => {
    if (!startDateTime || !endDateTime) return 0;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  return {
    eventType,
    setEventType: setEventTypeAndRecalculate,
    eventDate,
    setEventDate: setEventDateAndRecalculate,
    startDateTime,
    setStartDateTime,
    endDateTime,
    setEndDateTime,
    scheduleSessions,
    addScheduleSession,
    updateScheduleSession,
    removeScheduleSession,
    getEventScheduleData,
    getTotalDurationHours,
  };
}
