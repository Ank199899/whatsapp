require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMediaColumnsDirect() {
  try {
    console.log('🔄 Adding media columns to messages table...');
    
    // First, let's check the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
      return;
    }
    
    console.log('📊 Current table structure sample:', tableInfo[0] ? Object.keys(tableInfo[0]) : 'No data');
    
    // Try to insert a test message with media fields to see if they exist
    const testConversationId = 1100; // Use existing conversation
    
    try {
      const { data: testInsert, error: testError } = await supabase
        .from('messages')
        .insert({
          conversation_id: testConversationId,
          content: 'Test media message',
          direction: 'outgoing',
          media_url: '/test/media.jpg',
          media_type: 'image/jpeg',
          media_filename: 'test.jpg',
          media_size: 12345,
          status: 'sent'
        })
        .select();
      
      if (testError) {
        console.log('❌ Media columns do not exist:', testError.message);
        console.log('🔧 Need to add media columns manually via Supabase dashboard');
        console.log('📝 Please run this SQL in your Supabase SQL editor:');
        console.log(`
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS media_size INTEGER,
ADD COLUMN IF NOT EXISTS media_filename TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url);
        `);
      } else {
        console.log('✅ Media columns already exist!');
        console.log('📊 Test insert successful:', testInsert);
        
        // Clean up test message
        if (testInsert && testInsert[0]) {
          await supabase
            .from('messages')
            .delete()
            .eq('id', testInsert[0].id);
          console.log('🧹 Cleaned up test message');
        }
      }
    } catch (insertError) {
      console.error('❌ Error testing media columns:', insertError);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMediaColumnsDirect();
