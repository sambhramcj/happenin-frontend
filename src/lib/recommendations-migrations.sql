-- User Interactions Table for Recommendations
CREATE TABLE IF NOT EXISTS user_event_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'register', 'skip', 'like', 'share')),
  interaction_weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, event_id, interaction_type)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_colleges TEXT[] DEFAULT '{}',
  max_price DECIMAL(10, 2),
  max_distance_km INTEGER,
  preferred_days TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Similarity Cache (for performance)
CREATE TABLE IF NOT EXISTS event_similarity_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_a_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_b_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5, 4),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_a_id, event_b_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_event_interactions(user_email);
CREATE INDEX IF NOT EXISTS idx_interactions_event ON user_event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_event_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_email);
CREATE INDEX IF NOT EXISTS idx_similarity_event_a ON event_similarity_cache(event_a_id);
CREATE INDEX IF NOT EXISTS idx_similarity_event_b ON event_similarity_cache(event_b_id);
CREATE INDEX IF NOT EXISTS idx_similarity_score ON event_similarity_cache(similarity_score DESC);

-- Row Level Security
ALTER TABLE user_event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_similarity_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own interactions" ON user_event_interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_event_interactions;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can view similarity cache" ON event_similarity_cache;

-- Interaction policies
CREATE POLICY "Users can view own interactions"
  ON user_event_interactions FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert own interactions"
  ON user_event_interactions FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Preferences policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Similarity cache policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view similarity cache"
  ON event_similarity_cache FOR SELECT
  USING (auth.jwt() ->> 'email' IS NOT NULL);
