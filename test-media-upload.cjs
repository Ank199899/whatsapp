require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMediaUpload() {
  try {
    console.log('🧪 Testing media message creation...');
    
    // Find an existing conversation to add a media message to
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, contact_name, contact_phone')
      .limit(1);
    
    if (convError || !conversations || conversations.length === 0) {
      console.error('❌ No conversations found:', convError);
      return;
    }
    
    const conversation = conversations[0];
    console.log(`📱 Using conversation: ${conversation.contact_name} (${conversation.contact_phone})`);
    
    // Create a test media message with just the available columns
    const mediaMessage = {
      conversation_id: conversation.id,
      content: '📎 sample-document.pdf',
      direction: 'incoming',
      status: 'received',
      media_url: '/api/media/sample-document.pdf',
      message_type: 'media'
    };
    
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert(mediaMessage)
      .select();
    
    if (insertError) {
      console.error('❌ Error creating media message:', insertError);
    } else {
      console.log('✅ Media message created successfully!');
      console.log('📊 Message data:', insertedMessage[0]);
      
      // Also create an outgoing media message
      const outgoingMediaMessage = {
        conversation_id: conversation.id,
        content: '📷 photo.jpg',
        direction: 'outgoing',
        status: 'sent',
        media_url: '/api/media/photo.jpg',
        message_type: 'media'
      };
      
      const { data: outgoingMessage, error: outgoingError } = await supabase
        .from('messages')
        .insert(outgoingMediaMessage)
        .select();
      
      if (outgoingError) {
        console.error('❌ Error creating outgoing media message:', outgoingError);
      } else {
        console.log('✅ Outgoing media message created successfully!');
        console.log('📊 Outgoing message data:', outgoingMessage[0]);
      }
    }
    
    // Test fetching messages to see the format
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .eq('message_type', 'media')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching media messages:', fetchError);
    } else {
      console.log('\n📨 Recent media messages:');
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.direction}: ${msg.content} (${msg.media_url})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMediaUpload();
