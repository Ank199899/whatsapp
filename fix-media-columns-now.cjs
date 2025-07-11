require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMediaColumns() {
  try {
    console.log('🔄 Adding media columns to messages table...');
    
    // Try each column individually
    const alterCommands = [
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;',
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT;',
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size INTEGER;',
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename TEXT;'
    ];
    
    for (const command of alterCommands) {
      try {
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
        if (cmdError) {
          console.log(`⚠️ Command failed: ${command}`, cmdError.message);
        } else {
          console.log(`✅ Success: ${command}`);
        }
      } catch (err) {
        console.log(`❌ Error with command: ${command}`, err.message);
      }
    }
    
    // Add indexes
    const indexCommands = [
      'CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);',
      'CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url);'
    ];
    
    for (const command of indexCommands) {
      try {
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
        if (cmdError) {
          console.log(`⚠️ Index command failed: ${command}`, cmdError.message);
        } else {
          console.log(`✅ Index success: ${command}`);
        }
      } catch (err) {
        console.log(`❌ Index error: ${command}`, err.message);
      }
    }
    
    console.log('✅ Media columns setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMediaColumns();
