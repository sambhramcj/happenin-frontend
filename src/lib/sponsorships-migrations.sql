-- Sponsorships System Database Schema
-- Run this in Supabase SQL Editor

-- 1) Sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) Sponsorships table
CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  fest_id UUID,
  tier TEXT CHECK (tier IN ('title', 'gold', 'silver', 'partner')),
  amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_by TEXT, -- organizer_email
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) Sponsorship assets (logo/banner/cta) linked to each sponsorship
CREATE TABLE IF NOT EXISTS sponsorship_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID REFERENCES sponsorships(id) ON DELETE CASCADE,
  asset_type TEXT CHECK (asset_type IN ('logo', 'banner', 'cta')),
  asset_url TEXT,
  placement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsorships_event ON sponsorships(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_assets_sponsorship ON sponsorship_assets(sponsorship_id);

-- Enable RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies

-- Sponsors: public can read; organizers/admin can insert; admin can update/delete
DROP POLICY IF EXISTS "Public read sponsors" ON sponsors;
CREATE POLICY "Public read sponsors" ON sponsors
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Org/admin insert sponsors" ON sponsors;
CREATE POLICY "Org/admin insert sponsors" ON sponsors
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE email = auth.jwt() ->> 'email') IN ('organizer','admin')
  );

DROP POLICY IF EXISTS "Admin manage sponsors" ON sponsors;
CREATE POLICY "Admin manage sponsors" ON sponsors
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

-- Sponsorships: public can read approved; admins can read all; organizers can read own
DROP POLICY IF EXISTS "Public read approved sponsorships" ON sponsorships;
CREATE POLICY "Public read approved sponsorships" ON sponsorships
  FOR SELECT TO public
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admin read all sponsorships" ON sponsorships;
CREATE POLICY "Admin read all sponsorships" ON sponsorships
  FOR SELECT TO authenticated
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

DROP POLICY IF EXISTS "Organizer read own sponsorships" ON sponsorships;
CREATE POLICY "Organizer read own sponsorships" ON sponsorships
  FOR SELECT TO authenticated
  USING (created_by = auth.jwt() ->> 'email');

-- Inserts by organizers/admin with created_by matching caller
DROP POLICY IF EXISTS "Create sponsorships by org/admin" ON sponsorships;
CREATE POLICY "Create sponsorships by org/admin" ON sponsorships
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE email = auth.jwt() ->> 'email') IN ('organizer','admin')
    AND created_by = auth.jwt() ->> 'email'
  );

-- Updates: admin can update any; organizer can update own while pending
DROP POLICY IF EXISTS "Admin update sponsorships" ON sponsorships;
CREATE POLICY "Admin update sponsorships" ON sponsorships
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

DROP POLICY IF EXISTS "Organizer update pending own" ON sponsorships;
CREATE POLICY "Organizer update pending own" ON sponsorships
  FOR UPDATE TO authenticated
  USING (created_by = auth.jwt() ->> 'email' AND status = 'pending')
  WITH CHECK (created_by = auth.jwt() ->> 'email' AND status = 'pending');

-- Assets: public can read assets for approved sponsorships only
DROP POLICY IF EXISTS "Public read assets for approved" ON sponsorship_assets;
CREATE POLICY "Public read assets for approved" ON sponsorship_assets
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM sponsorships s 
      WHERE s.id = sponsorship_assets.sponsorship_id AND s.status = 'approved'
    )
  );

-- Insert/update by admin, or organizer who owns the parent sponsorship while pending
DROP POLICY IF EXISTS "Admin manage assets" ON sponsorship_assets;
CREATE POLICY "Admin manage assets" ON sponsorship_assets
  FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');

DROP POLICY IF EXISTS "Organizer manage pending assets" ON sponsorship_assets;
CREATE POLICY "Organizer manage pending assets" ON sponsorship_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sponsorships s
      WHERE s.id = sponsorship_assets.sponsorship_id
        AND s.created_by = auth.jwt() ->> 'email'
        AND s.status = 'pending'
    )
  );
