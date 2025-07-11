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

    // Try to test if column exists by selecting it
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('whatsapp_message_id')
      .limit(1);

    if (!testError) {
      console.log('✅ whatsapp_message_id column already exists');
      return;
    }

    if (testError && testError.code === '42703') {
      console.log('Column does not exist, attempting to add it...');

      // Try to add the column using raw SQL
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE messages
          ADD COLUMN whatsapp_message_id TEXT;

          CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id
          ON messages(whatsapp_message_id);
        `
      });

      if (alterError) {
        console.error('Error adding column via RPC:', alterError);
        console.log('Please run this SQL manually in your Supabase dashboard:');
        console.log('ALTER TABLE messages ADD COLUMN whatsapp_message_id TEXT;');
        console.log('CREATE INDEX idx_messages_whatsapp_message_id ON messages(whatsapp_message_id);');
        return;
      }

      console.log('✅ Successfully added whatsapp_message_id column');

      // Test the column again
      const { data: finalTestData, error: finalTestError } = await supabase
        .from('messages')
        .select('id, whatsapp_message_id')
        .limit(1);

      if (finalTestError) {
        console.error('Error testing new column:', finalTestError);
      } else {
        console.log('✅ Column is working correctly');
      }
    } else {
      console.error('Unexpected error testing column:', testError);
    }

  } catch (error) {
    console.error('Error in migration:', error);
  }
}

// Also fix the user ID issue
async function fixUserIdIssue() {
  try {
    console.log('🔧 Ensuring admin-user-123 exists in users table...');
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', 'admin-user-123')
      .single();
    
    if (!existingUser) {
      console.log('Creating admin-user-123...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: 'admin-user-123',
          email: 'admin@sendwopro.com',
          first_name: 'Admin',
          last_name: 'User',
          time_zone: 'Asia/Kolkata'
        });
      
      if (insertError) {
        console.error('Error creating user:', insertError);
      } else {
        console.log('✅ Created admin-user-123');
      }
    } else {
      console.log('✅ admin-user-123 already exists');
    }
    
  } catch (error) {
    console.error('Error fixing user ID:', error);
  }
}

async function main() {
  await addWhatsAppMessageIdColumn();
  await fixUserIdIssue();
  console.log('🎉 Migration completed!');
}

main().catch(console.error);
