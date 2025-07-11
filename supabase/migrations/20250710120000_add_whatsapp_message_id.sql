-- Add whatsapp_message_id column to messages table for tracking WhatsApp message IDs
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- Add index for whatsapp_message_id for faster lookups and duplicate prevention
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);

-- Add unique constraint to prevent duplicate WhatsApp messages
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id_unique 
ON messages(whatsapp_message_id) 
WHERE whatsapp_message_id IS NOT NULL;
