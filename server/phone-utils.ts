/**
 * Phone number utilities for consistent handling across the application
 */

/**
 * Normalize phone number to Indian format for comparison
 * Ensures all numbers are in 91XXXXXXXXXX format (Indian country code + 10 digits)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different Indian number formats
  if (digits.length === 10) {
    // 10 digits: assume Indian mobile number, add country code
    return '91' + digits;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    // 11 digits starting with 0: remove leading 0 and add country code
    return '91' + digits.substring(1);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    // 12 digits starting with 91: already in correct format
    return digits;
  }

  if (digits.length === 13 && digits.startsWith('091')) {
    // 13 digits starting with 091: remove leading 0
    return digits.substring(1);
  }

  // If it's already 12 digits and starts with 91, keep as is
  // Otherwise, try to extract the last 10 digits and add 91
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    // Validate that it's a valid Indian mobile number (starts with 6,7,8,9)
    if (['6', '7', '8', '9'].includes(last10[0])) {
      return '91' + last10;
    }
  }

  // If we can't normalize it properly, return the original digits
  return digits;
}

/**
 * Check if two phone numbers are the same after normalization
 */
export function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  return normalizePhoneNumber(phone1) === normalizePhoneNumber(phone2);
}

/**
 * Format phone number for display (Indian format: +91 XXXXX XXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 12 && normalized.startsWith('91')) {
    // Format as +91 XXXXX XXXXX
    const number = normalized.substring(2); // Remove 91
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  }
  return phone; // Return original if can't normalize
}

/**
 * Find existing conversation by phone number with normalized matching
 */
export function findConversationByPhone(conversations: any[], phoneNumber: string): any | undefined {
  return conversations.find(conv => 
    arePhoneNumbersEqual(conv.contact_phone || conv.contactPhone, phoneNumber)
  );
}

/**
 * Deduplicate conversations by phone number, keeping the most recent one
 */
export function deduplicateConversations(conversations: any[]): any[] {
  const phoneMap = new Map<string, any>();
  
  for (const conv of conversations) {
    const phone = conv.contact_phone || conv.contactPhone;
    const normalizedPhone = normalizePhoneNumber(phone);
    
    if (!phoneMap.has(normalizedPhone)) {
      phoneMap.set(normalizedPhone, conv);
    } else {
      // Keep the more recent conversation
      const existing = phoneMap.get(normalizedPhone);
      const existingDate = new Date(existing.updated_at || existing.created_at);
      const currentDate = new Date(conv.updated_at || conv.created_at);
      
      if (currentDate > existingDate) {
        phoneMap.set(normalizedPhone, conv);
      }
    }
  }
  
  return Array.from(phoneMap.values());
}
