-- PostGIS Integration for Better Performance
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to colleges table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'colleges' AND column_name = 'location'
  ) THEN
    ALTER TABLE colleges ADD COLUMN location GEOMETRY(Point, 4326);
  END IF;
END $$;

-- Update location column from latitude/longitude
UPDATE colleges 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_colleges_location ON colleges USING GIST(location);

-- Add geometry column to event_locations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_locations' AND column_name = 'location'
  ) THEN
    ALTER TABLE event_locations ADD COLUMN location GEOMETRY(Point, 4326);
  END IF;
END $$;

-- Update event_locations
UPDATE event_locations
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_event_locations_location ON event_locations USING GIST(location);

-- Function to find nearby colleges using PostGIS (much faster)
CREATE OR REPLACE FUNCTION get_nearby_colleges(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.city,
    c.state,
    c.latitude,
    c.longitude,
    ST_Distance(
      c.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM colleges c
  WHERE ST_DWithin(
    c.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_nearby_colleges(12.9716, 77.5946, 10);
