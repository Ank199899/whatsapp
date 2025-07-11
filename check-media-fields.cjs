require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMediaFields() {
  try {
    console.log('🔍 Checking media fields in recent messages...');
    
    // Get recent media messages with all fields
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, message_type, media_url, media_type, media_filename, media_size, direction, timestamp')
      .eq('message_type', 'media')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching media messages:', error);
      return;
    }
    
    console.log('📊 Recent media messages with fields:');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg.id}`);
      console.log(`   Content: ${msg.content || 'No content'}`);
      console.log(`   Type: ${msg.message_type}`);
      console.log(`   Direction: ${msg.direction}`);
      console.log(`   Media URL: ${msg.media_url ? `${msg.media_url.substring(0, 50)}...` : 'NULL'}`);
      console.log(`   Media Type: ${msg.media_type || 'NULL'}`);
      console.log(`   Media Filename: ${msg.media_filename || 'NULL'}`);
      console.log(`   Media Size: ${msg.media_size || 'NULL'}`);
      console.log(`   Time: ${msg.timestamp}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMediaFields();
