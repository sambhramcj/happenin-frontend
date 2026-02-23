// Component: EventScheduleBuilder
// Purpose: UI for organizers to build single-day or multi-day event schedules

'use client';

import { useState } from 'react';
import { Icons } from './icons';

interface ScheduleSession {
  date?: string;
  start_time: string;
  end_time: string;
  description: string;
}

interface EventScheduleBuilderProps {
  eventType: 'single-day' | 'multi-day';
  onEventTypeChange: (type: 'single-day' | 'multi-day') => void;
  eventDate: string;
  onEventDateChange: (date: string) => void;
  scheduleSessions: ScheduleSession[];
  onAddSession: (session: ScheduleSession) => void;
  onUpdateSession: (index: number, session: ScheduleSession) => void;
  onRemoveSession: (index: number) => void;
}

export function EventScheduleBuilder({
  eventType,
  onEventTypeChange,
  eventDate,
  onEventDateChange,
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
    const needsDate = eventType === 'single-day' ? !eventDate : !newSession.date;
    if (needsDate || !newSession.start_time || !newSession.end_time || !newSession.description.trim()) {
      alert('Please fill in all session details');
      return;
    }

    const sessionToSave: ScheduleSession = {
      ...newSession,
      date: eventType === 'single-day' ? eventDate : newSession.date,
    };

    if (editingIndex !== null) {
      onUpdateSession(editingIndex, sessionToSave);
      setEditingIndex(null);
    } else {
      onAddSession(sessionToSave);
    }

    setNewSession({ date: '', start_time: '10:00', end_time: '18:00', description: '' });
  };

  return (
    <div className="space-y-6 bg-bg-card rounded-xl p-6 border border-border-default">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Event Schedule</h3>
        <p className="text-sm text-text-secondary mb-4">Add your event timeline (e.g., 9:00 AM inauguration, 1:00 PM lunch).</p>

        <div className="space-y-4">
          <div className="bg-bg-muted p-4 rounded-lg border border-border-default">
            <label className="text-sm text-text-secondary block mb-2">Event Duration Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={eventType === 'single-day'}
                  onChange={() => onEventTypeChange('single-day')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-text-secondary">Single Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={eventType === 'multi-day'}
                  onChange={() => onEventTypeChange('multi-day')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-text-secondary">Multi Day</span>
              </label>
            </div>
          </div>

          <div className="bg-bg-muted p-4 rounded-lg border border-border-default">
            {eventType === 'single-day' ? (
              <>
                <label className="text-sm text-text-secondary block mb-2">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => onEventDateChange(e.target.value)}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                />
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                Multi-day mode enabled. Choose date per timeline entry below.
              </p>
            )}
          </div>

          <div className="bg-bg-muted p-4 rounded-lg border border-border-default space-y-4">
            <h4 className="font-semibold text-text-primary">
              {editingIndex !== null ? 'Edit Timeline Entry' : 'Add Timeline Entry'}
            </h4>

            {eventType === 'multi-day' && (
              <div>
                <label className="text-sm text-text-secondary block mb-2">Date</label>
                <input
                  type="date"
                  value={newSession.date || ''}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary block mb-2">From</label>
                <input
                  type="time"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">To</label>
                <input
                  type="time"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                  className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Description</label>
              <input
                type="text"
                placeholder="e.g., 09:00 AM Inauguration"
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
                {editingIndex !== null ? 'Update Entry' : 'Add Entry'}
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

          {scheduleSessions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">Timeline Preview</h4>
              {scheduleSessions.map((session, idx) => (
                <div key={idx} className="bg-bg-muted p-4 rounded-lg border border-border-default hover:border-primary transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icons.Clock className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-secondary">
                          {session.date ? `${session.date} • ` : ''}{session.start_time} - {session.end_time}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{session.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingIndex(idx);
                          setNewSession(session);
                        }}
                        className="p-2 text-text-secondary hover:text-primary transition-colors"
                        title="Edit entry"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onRemoveSession(idx)}
                        className="p-2 text-text-secondary hover:text-error transition-colors"
                        title="Delete entry"
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
            <div className="text-center py-8 text-text-muted bg-bg-muted rounded-lg border border-border-default">
              <p>No timeline entries yet. Add From/To time and description.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
