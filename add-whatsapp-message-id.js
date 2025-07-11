import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addWhatsAppMessageIdColumn() {
  try {
    console.log('🔧 Adding whatsapp_message_id column to messages table...');
    
    // Try to add the column directly
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id 
        ON messages(whatsapp_message_id);
      `
    });
    
    if (alterError) {
      console.error('Error adding column via RPC:', alterError);
      
      // Try alternative approach - test if column exists by trying to select it
      const { error: testError } = await supabase
        .from('messages')
        .select('whatsapp_message_id')
        .limit(1);
      
      if (testError && testError.code === '42703') {
        console.log('Column does not exist, please run this SQL manually in Supabase dashboard:');
        console.log('ALTER TABLE messages ADD COLUMN whatsapp_message_id TEXT;');
        console.log('CREATE INDEX idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);');
      } else if (!testError) {
        console.log('✅ whatsapp_message_id column already exists');
      }
      return;
    }
    
    console.log('✅ Successfully added whatsapp_message_id column');
    
    // Test the column
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('id, whatsapp_message_id')
      .limit(1);
    
    if (testError) {
      console.error('Error testing new column:', testError);
    } else {
      console.log('✅ Column is working correctly');
    }
    
  } catch (error) {
    console.error('Error in migration:', error);
  }
}

async function main() {
  await addWhatsAppMessageIdColumn();
  console.log('🎉 Migration completed!');
}

main().catch(console.error);
