#!/usr/bin/env node

/**
 * WhatsApp Session Cleanup Script
 * 
 * This script removes all WhatsApp session history including:
 * - Session directories and files
 * - Browser cache and data
 * - Authentication tokens
 * - QR code cache
 * 
 * Usage: node cleanup-whatsapp-sessions.js
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🧹 WhatsApp Session Cleanup Script');
console.log('==================================');

// Directories to clean
const directoriesToClean = [
  'whatsapp-web-sessions',
  'tokens',
  '.wwebjs_auth',
  '.wwebjs_cache',
  'node_modules/.cache/puppeteer',
];

// Files to clean
const filesToClean = [
  '.wwebjs_auth.json',
  'session.json',
];

function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        console.log(`📁 Found ${files.length} items in ${dirPath}`);
        
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${dirPath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error removing file ${filePath}:`, error.message);
    return false;
  }
}

function findSessionDirectories() {
  const sessionDirs = [];
  const currentDir = process.cwd();
  
  try {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        // Check for session-like directories
        if (item.startsWith('session_') || 
            item.startsWith('_IGNORE_session_') ||
            item.includes('session') && item.includes('_')) {
          sessionDirs.push(item);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error scanning for session directories:', error.message);
  }
  
  return sessionDirs;
}

async function cleanup() {
  console.log('🔍 Scanning for WhatsApp session data...\n');
  
  let removedCount = 0;
  let totalSize = 0;
  
  // Clean predefined directories
  console.log('📁 Cleaning predefined directories:');
  for (const dir of directoriesToClean) {
    if (removeDirectory(dir)) {
      removedCount++;
    }
  }
  
  // Clean predefined files
  console.log('\n📄 Cleaning predefined files:');
  for (const file of filesToClean) {
    if (removeFile(file)) {
      removedCount++;
    }
  }
  
  // Find and clean session directories
  console.log('\n🔍 Scanning for session directories:');
  const sessionDirs = findSessionDirectories();
  
  if (sessionDirs.length > 0) {
    console.log(`📱 Found ${sessionDirs.length} session directories:`);
    for (const dir of sessionDirs) {
      console.log(`  - ${dir}`);
      if (removeDirectory(dir)) {
        removedCount++;
      }
    }
  } else {
    console.log('✅ No additional session directories found');
  }
  
  // Clean browser cache directories
  console.log('\n🌐 Cleaning browser cache:');
  const browserCacheDirs = [
    path.join(process.cwd(), 'node_modules', '.cache'),
    path.join(os.homedir(), '.cache', 'puppeteer'),
    path.join(os.tmpdir(), 'puppeteer_dev_chrome_profile-*'),
  ];
  
  for (const cacheDir of browserCacheDirs) {
    if (cacheDir.includes('*')) {
      // Handle wildcard patterns
      const baseDir = path.dirname(cacheDir);
      const pattern = path.basename(cacheDir).replace('*', '');
      
      try {
        if (fs.existsSync(baseDir)) {
          const items = fs.readdirSync(baseDir);
          for (const item of items) {
            if (item.startsWith(pattern)) {
              const fullPath = path.join(baseDir, item);
              if (removeDirectory(fullPath)) {
                removedCount++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error cleaning cache pattern ${cacheDir}:`, error.message);
      }
    } else {
      if (removeDirectory(cacheDir)) {
        removedCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Cleanup completed!`);
  console.log(`📊 Removed ${removedCount} items`);
  console.log('✅ All WhatsApp session history has been cleared');
  console.log('\n💡 You can now start fresh with new WhatsApp connections');
  
  // Provide next steps
  console.log('\n📋 Next steps:');
  console.log('1. Restart your application server');
  console.log('2. Go to WhatsApp Setup page');
  console.log('3. Scan QR code to connect new WhatsApp number');
  console.log('4. Your WhatsApp integration will be fresh and clean!');
}

// Run cleanup
cleanup().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
