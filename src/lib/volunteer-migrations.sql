-- Volunteer System Database Schema
-- Run this in Supabase SQL Editor after the main migration

-- 1. Add volunteer fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS needs_volunteers BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS volunteer_roles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS volunteer_description TEXT;

-- Example volunteer_roles format:
-- [
--   {"role": "Registration Desk", "count": 5, "description": "Check-in attendees"},
--   {"role": "Stage Management", "count": 3, "description": "Manage stage equipment"}
-- ]

-- 2. Create volunteer_applications table
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by TEXT REFERENCES users(email),
  UNIQUE(event_id, student_email, role)
);

-- 3. Create volunteer_certificates table
CREATE TABLE IF NOT EXISTS volunteer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
 type TEXT NOT NULL DEFAULT 'volunteering' CHECK (type IN ('volunteering', 'participation', 'winning')),
  event_name TEXT NOT NULL,
 role TEXT,
  organization TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  certificate_url TEXT,
  issued_by TEXT,
 achievement TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create volunteer_assignments table (who's actually volunteering)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by TEXT REFERENCES users(email),
  hours_contributed DECIMAL(5,2) DEFAULT 0,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(event_id, student_email, role)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_event ON volunteer_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_student ON volunteer_applications(student_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_certificates_student ON volunteer_certificates(student_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_event ON volunteer_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_student ON volunteer_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_events_volunteers ON events(needs_volunteers) WHERE needs_volunteers = TRUE;

-- 6. Enable Row Level Security
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for volunteer_applications

-- Students can view their own applications
DROP POLICY IF EXISTS "Students view own applications" ON volunteer_applications;
CREATE POLICY "Students view own applications" ON volunteer_applications
  FOR SELECT
  TO authenticated
  USING (student_email = auth.jwt() ->> 'email');

-- Students can create applications
DROP POLICY IF EXISTS "Students create applications" ON volunteer_applications;
CREATE POLICY "Students create applications" ON volunteer_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_email = auth.jwt() ->> 'email' AND
    (SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'student'
  );

-- Organizers can view applications for their events
DROP POLICY IF EXISTS "Organizers view applications" ON volunteer_applications;
CREATE POLICY "Organizers view applications" ON volunteer_applications
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_email = auth.jwt() ->> 'email'
    )
  );

-- Organizers can update applications for their events
DROP POLICY IF EXISTS "Organizers update applications" ON volunteer_applications;
CREATE POLICY "Organizers update applications" ON volunteer_applications
  FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_email = auth.jwt() ->> 'email'
    )
  );

-- 8. RLS Policies for volunteer_certificates

-- Students can view their own certificates
DROP POLICY IF EXISTS "Students view own certificates" ON volunteer_certificates;
CREATE POLICY "Students view own certificates" ON volunteer_certificates
  FOR SELECT
  TO authenticated
  USING (student_email = auth.jwt() ->> 'email');

-- Students can create their own certificates
DROP POLICY IF EXISTS "Students create certificates" ON volunteer_certificates;
CREATE POLICY "Students create certificates" ON volunteer_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (student_email = auth.jwt() ->> 'email');

-- Students can update their own certificates
DROP POLICY IF EXISTS "Students update certificates" ON volunteer_certificates;
CREATE POLICY "Students update certificates" ON volunteer_certificates
  FOR UPDATE
  TO authenticated
  USING (student_email = auth.jwt() ->> 'email');

-- Organizers can view certificates of applicants
DROP POLICY IF EXISTS "Organizers view applicant certificates" ON volunteer_certificates;
CREATE POLICY "Organizers view applicant certificates" ON volunteer_certificates
  FOR SELECT
  TO authenticated
  USING (
    student_email IN (
      SELECT DISTINCT student_email 
      FROM volunteer_applications va
      JOIN events e ON va.event_id = e.id
      WHERE e.organizer_email = auth.jwt() ->> 'email'
    )
  );

-- 9. RLS Policies for volunteer_assignments

-- Public can view volunteer assignments (for event pages)
DROP POLICY IF EXISTS "Public view assignments" ON volunteer_assignments;
CREATE POLICY "Public view assignments" ON volunteer_assignments
  FOR SELECT
  TO public
  USING (true);

-- Organizers can create assignments for their events
DROP POLICY IF EXISTS "Organizers create assignments" ON volunteer_assignments;
CREATE POLICY "Organizers create assignments" ON volunteer_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE organizer_email = auth.jwt() ->> 'email'
    )
  );

-- Organizers can update assignments for their events
DROP POLICY IF EXISTS "Organizers update assignments" ON volunteer_assignments;
CREATE POLICY "Organizers update assignments" ON volunteer_assignments
  FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_email = auth.jwt() ->> 'email'
    )
  );

-- 10. Insert sample data (optional for testing)
-- Uncomment if you want test data

-- UPDATE events SET 
--   needs_volunteers = TRUE,
--   volunteer_roles = '[
--     {"role": "Registration Desk", "count": 5, "description": "Check-in attendees and distribute materials"},
--     {"role": "Stage Management", "count": 3, "description": "Manage stage setup and technical equipment"},
--     {"role": "Crowd Control", "count": 4, "description": "Ensure smooth flow of attendees"}
--   ]'::jsonb,
--   volunteer_description = 'We are looking for enthusiastic volunteers to help make this event a success!'
-- WHERE id = (SELECT id FROM events LIMIT 1);

-- Migration complete!
-- Next: Create API routes for volunteer management
