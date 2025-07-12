-- Add is_pinned column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering pinned conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned ON conversations(is_pinned);

-- Update existing conversations to have is_pinned = false (default)
UPDATE conversations SET is_pinned = FALSE WHERE is_pinned IS NULL;
