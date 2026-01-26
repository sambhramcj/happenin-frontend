-- Favorite Events System
-- Create favorite_events table
CREATE TABLE IF NOT EXISTS favorite_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_email, event_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_favorite_events_student ON favorite_events(student_email);
CREATE INDEX IF NOT EXISTS idx_favorite_events_event ON favorite_events(event_id);

-- Row Level Security
ALTER TABLE favorite_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorite events" ON favorite_events;
DROP POLICY IF EXISTS "Users can add favorite events" ON favorite_events;
DROP POLICY IF EXISTS "Users can remove their favorite events" ON favorite_events;

-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorite events"
  ON favorite_events FOR SELECT
  USING (student_email = auth.jwt() ->> 'email');

-- Users can add to favorites
CREATE POLICY "Users can add favorite events"
  ON favorite_events FOR INSERT
  WITH CHECK (student_email = auth.jwt() ->> 'email');

-- Users can remove from favorites
CREATE POLICY "Users can remove their favorite events"
  ON favorite_events FOR DELETE
  USING (student_email = auth.jwt() ->> 'email');
