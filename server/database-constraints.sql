-- Database constraints to prevent duplicate data

-- Add unique constraint for conversations to prevent duplicates by user_id and contact_phone
-- First, let's clean up any existing duplicates before adding the constraint
DO $$
DECLARE
    duplicate_record RECORD;
    keep_id UUID;
BEGIN
    -- Find and remove duplicate conversations
    FOR duplicate_record IN
        SELECT contact_phone, user_id, array_agg(id ORDER BY updated_at DESC) as ids
        FROM conversations
        WHERE contact_phone IS NOT NULL
        GROUP BY contact_phone, user_id
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (most recent) conversation, delete the rest
        keep_id := duplicate_record.ids[1];
        
        -- Delete messages from conversations we're about to delete
        DELETE FROM messages 
        WHERE conversation_id = ANY(duplicate_record.ids[2:]);
        
        -- Delete the duplicate conversations
        DELETE FROM conversations 
        WHERE id = ANY(duplicate_record.ids[2:]);
        
        RAISE NOTICE 'Cleaned up duplicates for phone %, kept conversation %', duplicate_record.contact_phone, keep_id;
    END LOOP;
END $$;

-- Add unique constraint to prevent future duplicates
ALTER TABLE conversations 
ADD CONSTRAINT unique_user_contact_phone 
UNIQUE (user_id, contact_phone);

-- Add unique constraint for messages to prevent duplicates by whatsapp_message_id
-- Clean up duplicate messages first
DO $$
DECLARE
    duplicate_msg RECORD;
    keep_msg_id UUID;
BEGIN
    -- Find and remove duplicate messages by whatsapp_message_id
    FOR duplicate_msg IN
        SELECT whatsapp_message_id, conversation_id, array_agg(id ORDER BY created_at ASC) as ids
        FROM messages
        WHERE whatsapp_message_id IS NOT NULL
        GROUP BY whatsapp_message_id, conversation_id
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (earliest) message, delete the rest
        keep_msg_id := duplicate_msg.ids[1];
        
        -- Delete the duplicate messages
        DELETE FROM messages 
        WHERE id = ANY(duplicate_msg.ids[2:]);
        
        RAISE NOTICE 'Cleaned up duplicate messages for whatsapp_message_id %, kept message %', duplicate_msg.whatsapp_message_id, keep_msg_id;
    END LOOP;
END $$;

-- Add unique constraint for whatsapp_message_id within a conversation
ALTER TABLE messages 
ADD CONSTRAINT unique_whatsapp_message_id_per_conversation 
UNIQUE (conversation_id, whatsapp_message_id);

-- Add index for better performance on phone number lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_phone 
ON conversations (user_id, contact_phone);

-- Add index for better performance on message lookups
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id 
ON messages (whatsapp_message_id);

-- Add index for better performance on message timestamp ordering
CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
ON messages (conversation_id, timestamp);

-- Function to normalize phone numbers consistently
CREATE OR REPLACE FUNCTION normalize_phone_number(phone_input TEXT)
RETURNS TEXT AS $$
DECLARE
    digits TEXT;
    normalized TEXT;
BEGIN
    -- Return empty string for null input
    IF phone_input IS NULL OR phone_input = '' THEN
        RETURN '';
    END IF;
    
    -- Remove all non-digit characters
    digits := regexp_replace(phone_input, '[^0-9]', '', 'g');
    
    -- Handle different Indian number formats
    IF length(digits) = 10 THEN
        -- 10 digits: assume Indian mobile number, add country code
        normalized := '91' || digits;
    ELSIF length(digits) = 11 AND left(digits, 1) = '0' THEN
        -- 11 digits starting with 0: remove leading 0 and add country code
        normalized := '91' || substring(digits, 2);
    ELSIF length(digits) = 12 AND left(digits, 2) = '91' THEN
        -- 12 digits starting with 91: already in correct format
        normalized := digits;
    ELSIF length(digits) = 13 AND left(digits, 3) = '091' THEN
        -- 13 digits starting with 091: remove leading 0
        normalized := substring(digits, 2);
    ELSIF length(digits) > 10 THEN
        -- Extract last 10 digits and validate
        digits := right(digits, 10);
        IF left(digits, 1) IN ('6', '7', '8', '9') THEN
            normalized := '91' || digits;
        ELSE
            normalized := digits;
        END IF;
    ELSE
        -- If we can't normalize it properly, return the original digits
        normalized := digits;
    END IF;
    
    RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to normalize phone numbers before insert/update
CREATE OR REPLACE FUNCTION normalize_conversation_phone()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize the contact_phone before storing
    NEW.contact_phone := normalize_phone_number(NEW.contact_phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize phone numbers
DROP TRIGGER IF EXISTS trigger_normalize_phone ON conversations;
CREATE TRIGGER trigger_normalize_phone
    BEFORE INSERT OR UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION normalize_conversation_phone();

-- Update existing phone numbers to normalized format
UPDATE conversations 
SET contact_phone = normalize_phone_number(contact_phone)
WHERE contact_phone IS NOT NULL;

-- Add check constraint to ensure phone numbers are in normalized format
ALTER TABLE conversations 
ADD CONSTRAINT check_normalized_phone 
CHECK (contact_phone IS NULL OR contact_phone = normalize_phone_number(contact_phone));

COMMIT;
