-- Add new columns to contacts table for enhanced features
-- Migration: Add contact features (AI, blocking, pinning, archiving, profile photo)

-- Add AI enabled column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- Add blocking status column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Add pinning status column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add archiving status column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add profile photo URL column
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_ai_enabled ON contacts(ai_enabled);
CREATE INDEX IF NOT EXISTS idx_contacts_is_blocked ON contacts(is_blocked);
CREATE INDEX IF NOT EXISTS idx_contacts_is_pinned ON contacts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_contacts_is_archived ON contacts(is_archived);

-- Update existing contacts to have default values
UPDATE contacts 
SET 
  ai_enabled = false,
  is_blocked = false,
  is_pinned = false,
  is_archived = false
WHERE 
  ai_enabled IS NULL 
  OR is_blocked IS NULL 
  OR is_pinned IS NULL 
  OR is_archived IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN contacts.ai_enabled IS 'Whether AI assistant is enabled for this contact';
COMMENT ON COLUMN contacts.is_blocked IS 'Whether this contact is blocked from sending messages';
COMMENT ON COLUMN contacts.is_pinned IS 'Whether this conversation is pinned to the top';
COMMENT ON COLUMN contacts.is_archived IS 'Whether this conversation is archived';
COMMENT ON COLUMN contacts.profile_photo_url IS 'URL to the contact profile photo from WhatsApp';
