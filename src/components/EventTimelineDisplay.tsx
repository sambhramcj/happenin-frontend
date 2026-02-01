// Component: EventTimelineDisplay
// Purpose: Display event schedule timeline for students

'use client';

import { Icons } from './icons';

interface ScheduleSession {
  date: string;
  start_time: string;
  end_time: string;
  description: string;
}

interface EventTimelineDisplayProps {
  startDateTime: string;
  endDateTime: string;
  scheduleSessions: ScheduleSession[] | null;
  eventTitle: string;
}

export function EventTimelineDisplay({
  startDateTime,
  endDateTime,
  scheduleSessions,
  eventTitle,
}: EventTimelineDisplayProps) {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  
  // Check if event is currently live
  const now = new Date();
  const isLive = now >= startDate && now <= endDate;
  
  // Check if event has ended
  const hasEnded = now > endDate;
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (hasEnded) return "Event ended";
    if (isLive) return "🔴 LIVE";
    
    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "Starts soon";
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
          <Icons.Calendar className="h-4 w-4 text-primary" />
          Event Timeline
        </h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          isLive ? 'bg-red-500/20 text-red-400' :
          hasEnded ? 'bg-gray-500/20 text-gray-400' :
          'bg-primary/20 text-primary'
        }`}>
          {getTimeRemaining()}
        </span>
      </div>

      {/* Multi-Day Timeline */}
      {scheduleSessions && scheduleSessions.length > 0 ? (
        <div className="space-y-2">
          {scheduleSessions.map((session, idx) => {
            const sessionStart = new Date(`${session.date}T${session.start_time}:00Z`);
            const sessionEnd = new Date(`${session.date}T${session.end_time}:00Z`);
            const sessionIsLive = now >= sessionStart && now <= sessionEnd;
            const sessionHasEnded = now > sessionEnd;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border transition-colors ${
                  sessionIsLive
                    ? 'bg-red-500/10 border-red-500/30'
                    : sessionHasEnded
                    ? 'bg-gray-500/5 border-gray-500/20 opacity-60'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {sessionIsLive && <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
                      <p className="text-xs font-medium text-text-primary">
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {session.start_time} - {session.end_time}
                    </p>
                    {session.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-1">
                        {session.description}
                      </p>
                    )}
                  </div>
                  {sessionIsLive && (
                    <span className="text-xs font-bold text-red-400 whitespace-nowrap">LIVE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single-Day Timeline */
        <div className={`p-3 rounded-lg border ${
          isLive
            ? 'bg-red-500/10 border-red-500/30'
            : hasEnded
            ? 'bg-gray-500/5 border-gray-500/20 opacity-60'
            : 'bg-primary/5 border-primary/20'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isLive && <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
                <p className="text-xs font-medium text-text-primary">
                  {startDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <p className="text-xs text-text-secondary">
                {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {isLive && (
              <span className="text-xs font-bold text-red-400 whitespace-nowrap">LIVE</span>
            )}
          </div>
        </div>
      )}

      {/* Total Duration */}
      <div className="text-xs text-text-muted pt-2 border-t border-border-default">
        <p>
          Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
        </p>
      </div>
    </div>
  );
}
