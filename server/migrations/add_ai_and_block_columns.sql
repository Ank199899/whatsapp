-- Add AI enabled and blocked status columns to conversations table
ALTER TABLE conversations 
ADD COLUMN ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN is_blocked BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX idx_conversations_ai_enabled ON conversations(ai_enabled);
CREATE INDEX idx_conversations_is_blocked ON conversations(is_blocked);

-- Update existing conversations to have AI disabled by default
UPDATE conversations SET ai_enabled = false WHERE ai_enabled IS NULL;
UPDATE conversations SET is_blocked = false WHERE is_blocked IS NULL;
