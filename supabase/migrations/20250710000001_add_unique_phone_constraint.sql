-- Add unique constraint to prevent duplicate WhatsApp phone numbers
-- This ensures that each phone number can only be connected once across the entire system

-- First, remove any existing duplicates by keeping only the most recent record for each phone number
WITH duplicates AS (
  SELECT 
    id,
    phone_number,
    ROW_NUMBER() OVER (PARTITION BY phone_number ORDER BY created_at DESC) as rn
  FROM whatsapp_numbers
)
DELETE FROM whatsapp_numbers 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint on phone_number
ALTER TABLE whatsapp_numbers 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);

-- Add index for better performance on phone number lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_phone_number 
ON whatsapp_numbers (phone_number);

-- Add index for user_id + phone_number combination
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_user_phone 
ON whatsapp_numbers (user_id, phone_number);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT unique_phone_number ON whatsapp_numbers IS 
'Ensures each WhatsApp phone number can only be connected once across the entire system to prevent duplicates';
