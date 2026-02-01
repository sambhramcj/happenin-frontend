// Component: EventScheduleBuilder
// Purpose: UI for organizers to build single-day or multi-day event schedules

'use client';

import { useState } from 'react';
import { Icons } from './icons';

interface ScheduleSession {
  date: string;
  start_time: string;
  end_time: string;
  description: string;
}

interface EventScheduleBuilderProps {
  eventType: 'single-day' | 'multi-day';
  onEventTypeChange: (type: 'single-day' | 'multi-day') => void;
  startDateTime: string;
  endDateTime: string;
  onStartDateTimeChange: (dt: string) => void;
  onEndDateTimeChange: (dt: string) => void;
  scheduleSessions: ScheduleSession[];
  onAddSession: (session: ScheduleSession) => void;
  onUpdateSession: (index: number, session: ScheduleSession) => void;
  onRemoveSession: (index: number) => void;
}

export function EventScheduleBuilder({
  eventType,
  onEventTypeChange,
  startDateTime,
  endDateTime,
  onStartDateTimeChange,
  onEndDateTimeChange,
  scheduleSessions,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
}: EventScheduleBuilderProps) {
  const [newSession, setNewSession] = useState<ScheduleSession>({
    date: '',
    start_time: '10:00',
    end_time: '18:00',
    description: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddSession = () => {
    if (!newSession.date || !newSession.start_time || !newSession.end_time) {
      alert('Please fill in all session details');
      return;
    }

    if (editingIndex !== null) {
      onUpdateSession(editingIndex, newSession);
      setEditingIndex(null);
    } else {
      onAddSession(newSession);
    }

    setNewSession({ date: '', start_time: '10:00', end_time: '18:00', description: '' });
  };

  const startDate = startDateTime ? new Date(startDateTime).toISOString().split('T')[0] : '';
  const startTime = startDateTime ? new Date(startDateTime).toISOString().split('T')[1].substring(0, 5) : '';
  const endDate = endDateTime ? new Date(endDateTime).toISOString().split('T')[0] : '';
  const endTime = endDateTime ? new Date(endDateTime).toISOString().split('T')[1].substring(0, 5) : '';

  return (
    <div className="space-y-6 bg-bg-card rounded-xl p-6 border border-border-default">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Event Schedule</h3>

        {/* Event Type Selection */}
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="eventType"
              value="single-day"
              checked={eventType === 'single-day'}
              onChange={(e) => onEventTypeChange(e.target.value as 'single-day' | 'multi-day')}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-text-primary">Single Day</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="eventType"
              value="multi-day"
              checked={eventType === 'multi-day'}
              onChange={(e) => onEventTypeChange(e.target.value as 'single-day' | 'multi-day')}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-text-primary">Multi-Day</span>
          </label>
        </div>

        {/* Single Day */}
        {eventType === 'single-day' && (
          <div className="space-y-4 bg-bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary block mb-2">Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    onStartDateTimeChange(`${e.target.value}T${startTime || '10:00'}:00Z`);
                    onEndDateTimeChange(`${e.target.value}T${endTime || '18:00'}:00Z`);
                  }}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => onStartDateTimeChange(`${startDate}T${e.target.value}:00Z`)}
                    className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary block mb-2">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => onEndDateTimeChange(`${endDate}T${e.target.value}:00Z`)}
                    className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Day */}
        {eventType === 'multi-day' && (
          <div className="space-y-4">
            {/* Add Session Form */}
            <div className="bg-bg-muted p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-text-primary">
                {editingIndex !== null ? 'Edit Session' : 'Add Session'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Start</label>
                    <input
                      type="time"
                      value={newSession.start_time}
                      onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                      className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">End</label>
                    <input
                      type="time"
                      value={newSession.end_time}
                      onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                      className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">Activity/Description</label>
                <input
                  type="text"
                  placeholder="e.g., Opening Ceremony, Main Competition"
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary placeholder-text-muted"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSession}
                  className="flex-1 bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover transition-all font-medium"
                >
                  {editingIndex !== null ? 'Update Session' : 'Add Session'}
                </button>
                {editingIndex !== null && (
                  <button
                    onClick={() => {
                      setEditingIndex(null);
                      setNewSession({ date: '', start_time: '10:00', end_time: '18:00', description: '' });
                    }}
                    className="px-4 py-2 bg-bg-muted text-text-secondary rounded-lg hover:bg-border-default transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Schedule Timeline */}
            {scheduleSessions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-text-primary">Event Timeline</h4>
                {scheduleSessions.map((session, idx) => (
                  <div key={idx} className="bg-bg-muted p-4 rounded-lg border border-border-default hover:border-primary transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Calendar className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-text-primary">{session.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Clock className="h-4 w-4 text-text-secondary" />
                          <span className="text-text-secondary">
                            {session.start_time} - {session.end_time}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-sm text-text-muted">{session.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingIndex(idx);
                            setNewSession(session);
                          }}
                          className="p-2 text-text-secondary hover:text-primary transition-colors"
                          title="Edit session"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onRemoveSession(idx)}
                          className="p-2 text-text-secondary hover:text-error transition-colors"
                          title="Delete session"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {scheduleSessions.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                <p>No sessions added yet. Add sessions to create your event timeline.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
