-- Add media columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS media_size INTEGER,
ADD COLUMN IF NOT EXISTS media_filename TEXT;

-- Add index for media queries
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url);
