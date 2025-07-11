import dotenv from 'dotenv';
import { supabase } from './server/db.ts';

dotenv.config();

async function addMediaColumns() {
  try {
    console.log('🔄 Adding media columns to messages table...');
    
    // Add media columns to messages table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS media_url TEXT,
        ADD COLUMN IF NOT EXISTS media_type TEXT,
        ADD COLUMN IF NOT EXISTS media_size INTEGER,
        ADD COLUMN IF NOT EXISTS media_filename TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
        CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url);
      `
    });
    
    if (error) {
      console.error('❌ Error adding media columns:', error);
      return;
    }
    
    console.log('✅ Media columns added successfully!');
    
    // Test the new columns
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('id, media_url, media_type, media_size, media_filename')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing media columns:', testError);
    } else {
      console.log('✅ Media columns are working correctly!');
      console.log('📊 Sample data:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMediaColumns();
