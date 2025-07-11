import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Test if columns exist by trying to select them
    console.log('📋 Testing whatsapp_message_id column...');
    const { error: testError1 } = await supabase
      .from('messages')
      .select('whatsapp_message_id')
      .limit(1);
    
    if (testError1 && testError1.code === '42703') {
      console.log('❌ whatsapp_message_id column missing');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('ALTER TABLE messages ADD COLUMN whatsapp_message_id TEXT;');
      console.log('CREATE INDEX idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);');
    } else {
      console.log('✅ whatsapp_message_id column exists');
    }
    
    console.log('📋 Testing whatsapp_number_id column...');
    const { error: testError2 } = await supabase
      .from('messages')
      .select('whatsapp_number_id')
      .limit(1);
    
    if (testError2 && testError2.code === '42703') {
      console.log('❌ whatsapp_number_id column missing');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('ALTER TABLE messages ADD COLUMN whatsapp_number_id INTEGER REFERENCES whatsapp_numbers(id);');
      console.log('CREATE INDEX idx_messages_whatsapp_number_id ON messages(whatsapp_number_id);');
    } else {
      console.log('✅ whatsapp_number_id column exists');
    }
    
    // Test messages table basic functionality
    console.log('📋 Testing messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, content, direction, status')
      .limit(5);
    
    if (messagesError) {
      console.error('❌ Error accessing messages table:', messagesError);
    } else {
      console.log(`✅ Messages table accessible, found ${messages.length} messages`);
    }
    
    // Test conversations table
    console.log('📋 Testing conversations table...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, contact_name, contact_phone, last_message')
      .limit(5);
    
    if (conversationsError) {
      console.error('❌ Error accessing conversations table:', conversationsError);
    } else {
      console.log(`✅ Conversations table accessible, found ${conversations.length} conversations`);
    }
    
    console.log('\n🎯 MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL commands:');
    console.log('\n-- Add missing columns to messages table');
    console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;');
    console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_number_id INTEGER REFERENCES whatsapp_numbers(id);');
    console.log('\n-- Add indexes for performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_number_id ON messages(whatsapp_number_id);');
    console.log('\n4. After running the SQL, restart your server');
    
  } catch (error) {
    console.error('Error in schema fix:', error);
  }
}

async function main() {
  await fixDatabaseSchema();
  console.log('🎉 Schema check completed!');
}

main().catch(console.error);
