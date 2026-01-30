-- Certificate System Migration - Complete Implementation
-- Created: January 30, 2026

-- ============================================
-- 1. CERTIFICATE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_email VARCHAR(255) NOT NULL,
  certificate_image_url VARCHAR(500) NOT NULL,
  name_position_x FLOAT NOT NULL,
  name_position_y FLOAT NOT NULL,
  name_font_family VARCHAR(255) DEFAULT 'Arial',
  name_font_size INTEGER DEFAULT 32,
  name_font_color VARCHAR(7) DEFAULT '#000000',
  name_text_alignment VARCHAR(50) DEFAULT 'center',
  recipient_type VARCHAR(50) NOT NULL, -- 'volunteer', 'participant', 'winner'
  template_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ready', 'sent'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_templates_event_id ON certificate_templates(event_id);
CREATE INDEX idx_certificate_templates_organizer ON certificate_templates(organizer_email);

-- ============================================
-- 2. CERTIFICATE RECIPIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
  student_email VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  certificate_url VARCHAR(500),
  generation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'generated', 'failed'
  sent_at TIMESTAMP,
  downloaded_at TIMESTAMP,
  failed_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_recipients_template ON certificate_recipients(template_id);
CREATE INDEX idx_certificate_recipients_email ON certificate_recipients(student_email);
CREATE INDEX idx_certificate_recipients_status ON certificate_recipients(generation_status);

-- ============================================
-- 3. STUDENT CERTIFICATES TABLE (Display)
-- ============================================
CREATE TABLE IF NOT EXISTS student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email VARCHAR(255) NOT NULL,
  certificate_url VARCHAR(500) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  certificate_type VARCHAR(50) NOT NULL, -- 'volunteer', 'participant', 'winning'
  certificate_title VARCHAR(255),
  issued_by VARCHAR(255), -- Organizer email
  recipient_type VARCHAR(50), -- volunteer, participant, winner
  sent_date TIMESTAMP DEFAULT NOW(),
  downloaded_date TIMESTAMP,
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_certificates_email ON student_certificates(student_email);
CREATE INDEX idx_student_certificates_type ON student_certificates(certificate_type);
CREATE INDEX idx_student_certificates_event ON student_certificates(event_id);

-- ============================================
-- 4. ACHIEVEMENT BADGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email VARCHAR(255) NOT NULL,
  badge_type VARCHAR(100) NOT NULL, -- 'volunteer_5', 'volunteer_10', 'event_winner', 'organizer_5', 'achievement'
  badge_name VARCHAR(255) NOT NULL,
  badge_description TEXT,
  badge_icon_url VARCHAR(500),
  earned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_achievement_badges_email ON achievement_badges(student_email);
CREATE INDEX idx_achievement_badges_type ON achievement_badges(badge_type);

-- ============================================
-- 5. VOLUNTEER APPLICATIONS (Update with certificate tracking)
-- ============================================
-- Note: If table already exists, this will be skipped
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_email VARCHAR(255) NOT NULL,
  volunteer_role_id UUID,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  motivation_statement TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  certificate_id UUID REFERENCES student_certificates(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_event ON volunteer_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email ON volunteer_applications(student_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);

-- ============================================
-- 6. CERTIFICATE HISTORY (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'generated', 'sent', 'downloaded', 'error'
  actor_email VARCHAR(255),
  recipient_email VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_history_template ON certificate_history(template_id);
CREATE INDEX idx_certificate_history_action ON certificate_history(action);

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_history ENABLE ROW LEVEL SECURITY;

-- Certificate Templates - Organizers can only see their own
CREATE POLICY template_organizer_policy ON certificate_templates
  FOR ALL USING (organizer_email = (auth.jwt() ->> 'email'));

-- Certificate Recipients - Only visible to organizer of template
CREATE POLICY recipient_organizer_policy ON certificate_recipients
  FOR ALL USING (
    template_id IN (
      SELECT id FROM certificate_templates 
      WHERE organizer_email = (auth.jwt() ->> 'email')
    )
  );

-- Student Certificates - Only student can see their own
CREATE POLICY student_cert_policy ON student_certificates
  FOR ALL USING (student_email = (auth.jwt() ->> 'email'));

-- Achievement Badges - Only student can see their own
CREATE POLICY badge_policy ON achievement_badges
  FOR ALL USING (student_email = (auth.jwt() ->> 'email'));

-- Certificate History - Only organizer can see
CREATE POLICY history_organizer_policy ON certificate_history
  FOR ALL USING (
    actor_email = (auth.jwt() ->> 'email')
  );

-- ============================================
-- FUNCTIONS FOR AUTOMATIC BADGE AWARDING
-- ============================================

CREATE OR REPLACE FUNCTION check_and_award_badges(p_student_email VARCHAR)
RETURNS void AS $$
DECLARE
  v_volunteer_count INT;
  v_winner_count INT;
  v_badges_count INT;
BEGIN
  -- Count volunteer certificates
  SELECT COUNT(*) INTO v_volunteer_count
  FROM student_certificates
  WHERE student_email = p_student_email
  AND certificate_type = 'volunteer';

  -- Count winning certificates
  SELECT COUNT(*) INTO v_winner_count
  FROM student_certificates
  WHERE student_email = p_student_email
  AND certificate_type = 'winning';

  -- Count existing badges
  SELECT COUNT(*) INTO v_badges_count
  FROM achievement_badges
  WHERE student_email = p_student_email;

  -- Award 5 Volunteer Badge
  IF v_volunteer_count >= 5 AND NOT EXISTS (
    SELECT 1 FROM achievement_badges
    WHERE student_email = p_student_email AND badge_type = 'volunteer_5'
  ) THEN
    INSERT INTO achievement_badges (student_email, badge_type, badge_name, badge_description)
    VALUES (p_student_email, 'volunteer_5', '🌟 Volunteer Master', 'Completed 5+ volunteer roles');
  END IF;

  -- Award 10 Volunteer Badge
  IF v_volunteer_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievement_badges
    WHERE student_email = p_student_email AND badge_type = 'volunteer_10'
  ) THEN
    INSERT INTO achievement_badges (student_email, badge_type, badge_name, badge_description)
    VALUES (p_student_email, 'volunteer_10', '🏆 Volunteer Legend', 'Completed 10+ volunteer roles');
  END IF;

  -- Award Event Winner Badge
  IF v_winner_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM achievement_badges
    WHERE student_email = p_student_email AND badge_type = 'event_winner'
  ) THEN
    INSERT INTO achievement_badges (student_email, badge_type, badge_name, badge_description)
    VALUES (p_student_email, 'event_winner', '🥇 Event Winner', 'Won an event competition');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO AUTO-AWARD BADGES ON NEW CERTIFICATE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.student_email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_badges_on_certificate
AFTER INSERT ON student_certificates
FOR EACH ROW
EXECUTE FUNCTION trigger_check_badges();

-- ============================================
-- FUNCTION TO TRACK CERTIFICATE HISTORY
-- ============================================

CREATE OR REPLACE FUNCTION log_certificate_action(
  p_template_id UUID,
  p_action VARCHAR,
  p_actor_email VARCHAR,
  p_recipient_email VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO certificate_history (template_id, action, actor_email, recipient_email, details)
  VALUES (p_template_id, p_action, p_actor_email, p_recipient_email, p_details);
END;
$$ LANGUAGE plpgsql;
