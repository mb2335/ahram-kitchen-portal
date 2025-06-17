
-- Remove the location column from pickup_settings table since location is no longer needed
ALTER TABLE pickup_settings DROP COLUMN IF EXISTS location;
