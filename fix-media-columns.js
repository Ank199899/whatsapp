import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixMediaColumns() {
  try {
    console.log('🔧 Checking and fixing media columns in messages table...');
    
    // First, let's check what columns exist
    console.log('📋 Checking existing columns...');
    const { data: existingColumns, error: checkError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing columns:', checkError);
      return;
    }
    
    console.log('✅ Current columns in messages table:', Object.keys(existingColumns[0] || {}));
    
    // Try to add the missing columns using raw SQL
    console.log('🔄 Adding missing media columns...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add media columns if they don't exist
        DO $$ 
        BEGIN
          -- Check and add media_type column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'media_type'
          ) THEN
            ALTER TABLE messages ADD COLUMN media_type TEXT;
            RAISE NOTICE 'Added media_type column';
          ELSE
            RAISE NOTICE 'media_type column already exists';
          END IF;
          
          -- Check and add media_size column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'media_size'
          ) THEN
            ALTER TABLE messages ADD COLUMN media_size INTEGER;
            RAISE NOTICE 'Added media_size column';
          ELSE
            RAISE NOTICE 'media_size column already exists';
          END IF;
          
          -- Check and add media_filename column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'media_filename'
          ) THEN
            ALTER TABLE messages ADD COLUMN media_filename TEXT;
            RAISE NOTICE 'Added media_filename column';
          ELSE
            RAISE NOTICE 'media_filename column already exists';
          END IF;
        END $$;
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
        CREATE INDEX IF NOT EXISTS idx_messages_media_filename ON messages(media_filename);
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding media columns:', alterError);
      
      // Try alternative approach - direct ALTER TABLE commands
      console.log('🔄 Trying alternative approach...');
      
      const commands = [
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT;',
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size INTEGER;',
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename TEXT;',
        'CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);',
        'CREATE INDEX IF NOT EXISTS idx_messages_media_filename ON messages(media_filename);'
      ];
      
      for (const command of commands) {
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
        if (cmdError) {
          console.error(`❌ Error executing: ${command}`, cmdError);
        } else {
          console.log(`✅ Executed: ${command}`);
        }
      }
    } else {
      console.log('✅ Media columns migration completed successfully!');
    }
    
    // Verify the columns were added
    console.log('🔍 Verifying columns...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying columns:', verifyError);
    } else {
      console.log('✅ Final columns in messages table:', Object.keys(verifyData[0] || {}));
    }
    
    // Test inserting a message with media_type
    console.log('🧪 Testing media_type column...');
    const testConversationId = 1100; // Use existing conversation
    
    const { data: testInsert, error: testError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConversationId,
        content: 'Test message with media type',
        direction: 'incoming',
        media_type: 'text',
        status: 'received'
      })
      .select();
    
    if (testError) {
      console.error('❌ Error testing media_type column:', testError);
    } else {
      console.log('✅ Successfully inserted test message with media_type:', testInsert);
      
      // Clean up test message
      if (testInsert && testInsert[0]) {
        await supabase
          .from('messages')
          .delete()
          .eq('id', testInsert[0].id);
        console.log('🧹 Cleaned up test message');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  await fixMediaColumns();
  console.log('🎉 Media columns fix completed!');
}

main().catch(console.error);
