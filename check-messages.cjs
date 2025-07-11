require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
  try {
    console.log('🔍 Checking recent messages...');
    
    // Get recent messages to see their format
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, message_type, direction, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching messages:', error);
      return;
    }
    
    console.log('📊 Recent messages:');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. ID: ${msg.id}`);
      console.log(`   Type: ${msg.message_type}`);
      console.log(`   Direction: ${msg.direction}`);
      console.log(`   Content: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
      console.log(`   Time: ${msg.timestamp}`);
      console.log('   ---');
    });
    
    // Check for media messages specifically
    const { data: mediaMessages, error: mediaError } = await supabase
      .from('messages')
      .select('id, content, message_type')
      .eq('message_type', 'media')
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (mediaError) {
      console.error('❌ Error fetching media messages:', mediaError);
    } else {
      console.log('\n📎 Recent media messages:');
      mediaMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ID: ${msg.id} - Content: ${msg.content}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMessages();
