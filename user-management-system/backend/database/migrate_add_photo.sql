-- Run this if the profile_photo column doesn't exist yet in your database
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo LONGTEXT;

-- Also increase MySQL max_allowed_packet for large base64 strings (run as root)
SET GLOBAL max_allowed_packet = 67108864;
