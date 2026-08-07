-- Clears dummy/test photo URLs from matrimony profiles.
-- Run this once against your database:
--   psql $DATABASE_URL -f fix_dummy_photos.sql

UPDATE "MatrimonyProfile"
SET photos = ARRAY[]::text[]
WHERE EXISTS (
  SELECT 1
  FROM unnest(photos) AS photo
  WHERE photo NOT LIKE '%amazonaws.com%'
    AND photo NOT LIKE '%/api/v1/media/proxy/%'
    AND photo NOT LIKE 'http://192.168%'
    AND photo NOT LIKE 'https://community-api.metromindz.com%'
);

-- Show affected rows after cleanup
SELECT id, "displayName", photos
FROM "MatrimonyProfile"
WHERE array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0;
