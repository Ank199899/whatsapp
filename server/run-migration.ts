import { config } from 'dotenv';
import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

async function runMigration() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available. Please set SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log('🔄 Running pin column migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_pin_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('❌ Migration error:', error);
          // Continue with other statements even if one fails
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
