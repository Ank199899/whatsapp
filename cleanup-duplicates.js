#!/usr/bin/env node

/**
 * Script to clean up duplicate WhatsApp numbers in the database
 * This script will remove duplicate phone numbers, keeping only the most recent one
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting cleanup of duplicate WhatsApp numbers...');

    // Get all WhatsApp numbers
    const { data: allNumbers, error } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching WhatsApp numbers:', error);
      return;
    }

    if (!allNumbers || allNumbers.length === 0) {
      console.log('✅ No WhatsApp numbers found');
      return;
    }

    console.log(`📱 Found ${allNumbers.length} total WhatsApp numbers`);

    // Group by phone number
    const phoneGroups = new Map();
    
    for (const number of allNumbers) {
      const phone = number.phone_number;
      if (!phone) continue;

      if (!phoneGroups.has(phone)) {
        phoneGroups.set(phone, []);
      }
      phoneGroups.get(phone).push(number);
    }

    console.log(`📊 Found ${phoneGroups.size} unique phone numbers`);

    let totalRemoved = 0;
    let duplicateGroups = 0;

    // Process each phone number group
    for (const [phone, numbers] of phoneGroups) {
      if (numbers.length > 1) {
        duplicateGroups++;
        console.log(`\n🔍 Processing duplicates for ${phone}:`);
        console.log(`   Found ${numbers.length} entries`);

        // Sort by created_at descending (most recent first)
        numbers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Keep the first (most recent), remove the rest
        const toKeep = numbers[0];
        const toRemove = numbers.slice(1);

        console.log(`   ✅ Keeping: ID ${toKeep.id} (created: ${toKeep.created_at})`);

        for (const duplicate of toRemove) {
          try {
            const { error: deleteError } = await supabase
              .from('whatsapp_numbers')
              .delete()
              .eq('id', duplicate.id);

            if (deleteError) {
              console.error(`   ❌ Error removing ID ${duplicate.id}:`, deleteError);
            } else {
              console.log(`   🗑️ Removed: ID ${duplicate.id} (created: ${duplicate.created_at})`);
              totalRemoved++;
            }
          } catch (err) {
            console.error(`   ❌ Exception removing ID ${duplicate.id}:`, err);
          }
        }
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total numbers processed: ${allNumbers.length}`);
    console.log(`   Unique phone numbers: ${phoneGroups.size}`);
    console.log(`   Phone numbers with duplicates: ${duplicateGroups}`);
    console.log(`   Duplicate entries removed: ${totalRemoved}`);
    console.log(`   Remaining numbers: ${allNumbers.length - totalRemoved}`);

    if (totalRemoved > 0) {
      console.log('\n✅ Cleanup completed successfully!');
    } else {
      console.log('\n✅ No duplicates found - database is clean!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicates()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
