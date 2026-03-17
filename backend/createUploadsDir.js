/**
 * Script to create uploads directory structure
 * Run with: node createUploadsDir.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createUploadsDirectory() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const roomsDir = path.join(uploadsDir, 'rooms');

  try {
    // Create uploads directory
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log('✅ Created uploads directory');
    } else {
      console.log('✅ Uploads directory already exists');
    }

    // Create rooms subdirectory
    if (!fs.existsSync(roomsDir)) {
      fs.mkdirSync(roomsDir);
      console.log('✅ Created uploads/rooms directory');
    } else {
      console.log('✅ Uploads/rooms directory already exists');
    }

    // Set permissions (if on Unix-like system)
    try {
      fs.chmodSync(uploadsDir, 0o755);
      fs.chmodSync(roomsDir, 0o755);
      console.log('✅ Set directory permissions');
    } catch (permError) {
      console.log('⚠️  Could not set permissions (this is normal on Windows)');
    }

    console.log('\n📁 Directory structure:');
    console.log(`${uploadsDir}/`);
    console.log(`  └── rooms/`);

    console.log('\n🎯 Uploads directory setup complete!');
    console.log('You can now upload room images through the admin panel.');

  } catch (error) {
    console.error('❌ Error creating directories:', error);
  }
}

createUploadsDirectory();