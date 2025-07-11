import dotenv from 'dotenv';
import { supabase } from './server/db.ts';

dotenv.config();

async function applyMediaMigration() {
  try {
    console.log('🔄 Applying media columns migration...');
    
    // Add media columns to messages table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add media columns to messages table if they don't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_type') THEN
            ALTER TABLE messages ADD COLUMN media_type TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_size') THEN
            ALTER TABLE messages ADD COLUMN media_size INTEGER;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_filename') THEN
            ALTER TABLE messages ADD COLUMN media_filename TEXT;
          END IF;
        END $$;
        
        -- Create indexes for media queries
        CREATE INDEX IF NOT EXISTS idx_messages_media_type ON messages(media_type);
        CREATE INDEX IF NOT EXISTS idx_messages_media_filename ON messages(media_filename);
      `
    });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      return;
    }
    
    console.log('✅ Media columns migration applied successfully!');
    
    // Verify the columns were added
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name IN ('media_type', 'media_size', 'media_filename', 'media_url')
        ORDER BY column_name;
      `
    });
    
    if (columnsError) {
      console.error('❌ Error verifying columns:', columnsError);
      return;
    }
    
    console.log('📋 Media columns in messages table:');
    if (columns && Array.isArray(columns)) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMediaMigration();
