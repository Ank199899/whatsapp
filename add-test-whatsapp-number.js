import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestWhatsAppNumber() {
  try {
    console.log('🔧 Adding test WhatsApp number...');
    
    // First ensure admin user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', 'admin-user-123')
      .single();
    
    if (!existingUser) {
      console.log('Creating admin user...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: 'admin-user-123',
          email: 'admin@sendwopro.com',
          first_name: 'Admin',
          last_name: 'User',
          time_zone: 'Asia/Kolkata'
        });
      
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }
      console.log('✅ Created admin user');
    }
    
    // Check if WhatsApp number already exists
    const { data: existingNumber } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('user_id', 'admin-user-123')
      .eq('phone_number', '+919211737685')
      .single();
    
    if (existingNumber) {
      console.log('✅ Test WhatsApp number already exists:', existingNumber);
      return;
    }
    
    // Create test WhatsApp number
    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .insert({
        user_id: 'admin-user-123',
        phone_number: '+919211737685',
        display_name: 'Test WhatsApp (+919211737685)',
        account_type: 'personal',
        connection_type: 'qr_code',
        status: 'connected',
        daily_message_limit: 100,
        messages_sent_today: 0,
        success_rate: 95.50,
        last_activity: new Date().toISOString(),
        session_data: { sessionId: 'session_admin-user-123_test' },
        provider_name: 'whatsapp-web.js',
        notes: 'Test WhatsApp number for development'
      })
      .select()
      .single();
    
    if (whatsappError) {
      console.error('❌ Error creating WhatsApp number:', whatsappError);
      return;
    }
    
    console.log('✅ Created test WhatsApp number:', whatsappNumber);
    
    // Create a few test conversations
    console.log('📱 Creating test conversations...');
    
    const testConversations = [
      {
        user_id: 'admin-user-123',
        whatsapp_number_id: whatsappNumber.id,
        contact_name: 'John Doe',
        contact_phone: '+919876543210',
        last_message: 'Hello! How are you?',
        last_message_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        unread_count: 2,
        status: 'active'
      },
      {
        user_id: 'admin-user-123',
        whatsapp_number_id: whatsappNumber.id,
        contact_name: 'Jane Smith',
        contact_phone: '+919876543211',
        last_message: 'Thanks for the information!',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        unread_count: 0,
        status: 'active'
      },
      {
        user_id: 'admin-user-123',
        whatsapp_number_id: whatsappNumber.id,
        contact_name: 'Mike Johnson',
        contact_phone: '+919876543212',
        last_message: 'Can we schedule a meeting?',
        last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        unread_count: 1,
        status: 'active'
      }
    ];
    
    for (const conversation of testConversations) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single();
      
      if (convError) {
        console.error('❌ Error creating conversation:', convError);
      } else {
        console.log(`✅ Created conversation with ${conversation.contact_name}`);
        
        // Add some test messages for each conversation
        const testMessages = [
          {
            conversation_id: conv.id,
            content: conversation.last_message,
            direction: 'incoming',
            status: 'received',
            timestamp: conversation.last_message_at,
            whatsapp_number_id: whatsappNumber.id
          },
          {
            conversation_id: conv.id,
            content: 'Thanks for reaching out!',
            direction: 'outgoing',
            status: 'delivered',
            timestamp: new Date(new Date(conversation.last_message_at).getTime() + 1000 * 60 * 5).toISOString(),
            whatsapp_number_id: whatsappNumber.id
          }
        ];
        
        for (const message of testMessages) {
          const { error: msgError } = await supabase
            .from('messages')
            .insert(message);
          
          if (msgError) {
            console.error('❌ Error creating message:', msgError);
          }
        }
      }
    }
    
    console.log('\n🎉 Test data created successfully!');
    console.log('📱 WhatsApp Number:', whatsappNumber.phone_number);
    console.log('💬 Conversations: 3');
    console.log('📨 Messages: 6');
    console.log('\n✅ You can now test the inbox functionality!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestWhatsAppNumber();
