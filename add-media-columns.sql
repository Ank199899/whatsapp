-- Add media columns to messages table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_type') THEN
    ALTER TABLE messages ADD COLUMN media_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_size') THEN
    ALTER TABLE messages ADD COLUMN media_size INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_filename') THEN
    ALTER TABLE messages ADD COLUMN media_filename TEXT;
  END IF;
END $$;

-- Create indexes for media queries
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
CREATE INDEX IF NOT EXISTS idx_messages_media_filename ON messages(media_filename);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('media_type', 'media_size', 'media_filename', 'media_url')
ORDER BY column_name;
