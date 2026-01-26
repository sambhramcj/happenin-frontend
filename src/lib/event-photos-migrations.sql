-- Event Photo Memories System
-- Create event_photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  faces_detected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_by TEXT,
  moderated_at TIMESTAMP WITH TIME ZONE
);

-- Create photo_tags table for face matching
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  face_encoding JSONB, -- Store face recognition data
  position_x DECIMAL,
  position_y DECIMAL,
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_photos_event ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_status ON event_photos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_student ON photo_tags(student_email);

-- Row Level Security
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved event photos" ON event_photos;
DROP POLICY IF EXISTS "Users can upload event photos" ON event_photos;
DROP POLICY IF EXISTS "Admins can moderate photos" ON event_photos;
DROP POLICY IF EXISTS "Users can view their photo tags" ON photo_tags;
DROP POLICY IF EXISTS "Users can confirm their tags" ON photo_tags;

-- Photos policies
CREATE POLICY "Anyone can view approved event photos"
  ON event_photos FOR SELECT
  USING (moderation_status = 'approved');

CREATE POLICY "Users can upload event photos"
  ON event_photos FOR INSERT
  WITH CHECK (uploaded_by = auth.jwt() ->> 'email');

CREATE POLICY "Admins can moderate photos"
  ON event_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role = 'admin'
    )
  );

-- Photo tags policies
CREATE POLICY "Users can view their photo tags"
  ON photo_tags FOR SELECT
  USING (student_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can confirm their tags"
  ON photo_tags FOR UPDATE
  USING (student_email = auth.jwt() ->> 'email');
