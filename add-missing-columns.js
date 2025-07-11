import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing database columns...');
    
    // Test if whatsapp_message_id column exists by trying to select it
    console.log('🔍 Checking if whatsapp_message_id column exists...');
    const { error: testError } = await supabase
      .from('messages')
      .select('whatsapp_message_id')
      .limit(1);
    
    if (testError && testError.code === '42703') {
      console.log('❌ whatsapp_message_id column does not exist');
      console.log('📝 Please run this SQL manually in your Supabase dashboard:');
      console.log('');
      console.log('-- Add whatsapp_message_id column to messages table');
      console.log('ALTER TABLE messages ADD COLUMN whatsapp_message_id TEXT;');
      console.log('');
      console.log('-- Create index for better performance');
      console.log('CREATE INDEX idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);');
      console.log('');
      console.log('-- Add last_connected_at column to whatsapp_numbers table if it doesn\'t exist');
      console.log('ALTER TABLE whatsapp_numbers ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP WITH TIME ZONE;');
      console.log('');
      console.log('-- Add real_time_sync column to conversations table for tracking sync status');
      console.log('ALTER TABLE conversations ADD COLUMN IF NOT EXISTS real_time_sync BOOLEAN DEFAULT true;');
      console.log('');
      console.log('-- Add whatsapp_chat_id column to conversations table for WhatsApp chat mapping');
      console.log('ALTER TABLE conversations ADD COLUMN IF NOT EXISTS whatsapp_chat_id TEXT;');
      console.log('');
      console.log('-- Create index for whatsapp_chat_id');
      console.log('CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_chat_id ON conversations(whatsapp_chat_id);');
      console.log('');
      console.log('🚨 After running the SQL above, run this script again to verify the columns were added.');
      return;
    } else if (!testError) {
      console.log('✅ whatsapp_message_id column already exists');
    } else {
      console.error('Error checking whatsapp_message_id column:', testError);
      return;
    }
    
    // Test other columns
    console.log('🔍 Checking other columns...');
    
    // Check last_connected_at in whatsapp_numbers
    const { error: lastConnectedError } = await supabase
      .from('whatsapp_numbers')
      .select('last_connected_at')
      .limit(1);
    
    if (lastConnectedError && lastConnectedError.code === '42703') {
      console.log('❌ last_connected_at column missing in whatsapp_numbers');
    } else if (!lastConnectedError) {
      console.log('✅ last_connected_at column exists in whatsapp_numbers');
    }
    
    // Check real_time_sync in conversations
    const { error: realTimeSyncError } = await supabase
      .from('conversations')
      .select('real_time_sync')
      .limit(1);
    
    if (realTimeSyncError && realTimeSyncError.code === '42703') {
      console.log('❌ real_time_sync column missing in conversations');
    } else if (!realTimeSyncError) {
      console.log('✅ real_time_sync column exists in conversations');
    }
    
    // Check whatsapp_chat_id in conversations
    const { error: whatsappChatIdError } = await supabase
      .from('conversations')
      .select('whatsapp_chat_id')
      .limit(1);
    
    if (whatsappChatIdError && whatsappChatIdError.code === '42703') {
      console.log('❌ whatsapp_chat_id column missing in conversations');
    } else if (!whatsappChatIdError) {
      console.log('✅ whatsapp_chat_id column exists in conversations');
    }
    
    console.log('🎉 Column check completed!');
    
  } catch (error) {
    console.error('❌ Error checking columns:', error);
  }
}

async function main() {
  await addMissingColumns();
}

main().catch(console.error);
