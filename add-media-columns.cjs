require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMediaColumns() {
  try {
    console.log('🔄 Adding media columns to messages table...');
    
    // Add media columns to messages table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS media_url TEXT,
        ADD COLUMN IF NOT EXISTS media_type TEXT,
        ADD COLUMN IF NOT EXISTS media_size INTEGER,
        ADD COLUMN IF NOT EXISTS media_filename TEXT;
      `
    });
    
    if (error) {
      console.error('❌ Error adding media columns:', error);
      
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      
      const queries = [
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT',
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_type TEXT', 
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_size INTEGER',
        'ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_filename TEXT'
      ];
      
      for (const query of queries) {
        const { error: queryError } = await supabase.rpc('exec_sql', { sql: query });
        if (queryError) {
          console.error(`❌ Error with query "${query}":`, queryError);
        } else {
          console.log(`✅ Successfully executed: ${query}`);
        }
      }
    } else {
      console.log('✅ Media columns added successfully!');
    }
    
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
