require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingMediaColumns() {
  try {
    console.log('🔄 Adding missing media columns to messages table...');
    
    // Since we can't use ALTER TABLE directly, let's try a different approach
    // We'll create a test message to see which columns are missing
    
    const testConversationId = 1100; // Use existing conversation
    
    // Test each column individually
    const columnsToTest = [
      { name: 'media_type', value: 'image/jpeg' },
      { name: 'media_size', value: 12345 },
      { name: 'media_filename', value: 'test.jpg' }
    ];
    
    const missingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const testData = {
          conversation_id: testConversationId,
          content: `Test for ${column.name}`,
          direction: 'outgoing',
          status: 'sent'
        };
        testData[column.name] = column.value;
        
        const { data: testInsert, error: testError } = await supabase
          .from('messages')
          .insert(testData)
          .select();
        
        if (testError) {
          console.log(`❌ Column ${column.name} is missing:`, testError.message);
          missingColumns.push(column.name);
        } else {
          console.log(`✅ Column ${column.name} exists`);
          // Clean up test message
          if (testInsert && testInsert[0]) {
            await supabase
              .from('messages')
              .delete()
              .eq('id', testInsert[0].id);
          }
        }
      } catch (error) {
        console.log(`❌ Error testing ${column.name}:`, error.message);
        missingColumns.push(column.name);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log('\n🔧 Missing columns detected:', missingColumns);
      console.log('\n📝 Please add these columns manually in your Supabase dashboard:');
      console.log('Go to: https://supabase.com/dashboard/project/[your-project]/editor');
      console.log('Navigate to: Table Editor > messages table');
      console.log('Click: "Add Column" for each missing column:');
      
      missingColumns.forEach(column => {
        switch(column) {
          case 'media_type':
            console.log(`- Column name: media_type, Type: text, Nullable: true`);
            break;
          case 'media_size':
            console.log(`- Column name: media_size, Type: int8, Nullable: true`);
            break;
          case 'media_filename':
            console.log(`- Column name: media_filename, Type: text, Nullable: true`);
            break;
        }
      });
      
      console.log('\nOr run this SQL in the SQL Editor:');
      const sqlCommands = missingColumns.map(column => {
        switch(column) {
          case 'media_type':
            return 'ALTER TABLE messages ADD COLUMN media_type TEXT;';
          case 'media_size':
            return 'ALTER TABLE messages ADD COLUMN media_size INTEGER;';
          case 'media_filename':
            return 'ALTER TABLE messages ADD COLUMN media_filename TEXT;';
          default:
            return '';
        }
      }).filter(cmd => cmd);
      
      console.log(sqlCommands.join('\n'));
    } else {
      console.log('✅ All media columns exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingMediaColumns();
