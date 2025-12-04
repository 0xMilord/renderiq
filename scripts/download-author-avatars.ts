import * as fs from 'fs';
import * as path from 'path';
import https from 'https';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'blog', 'author');
const INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// DiceBear API configuration
const DICEBEAR_STYLE = 'thumbs'; // Using thumbs style
const DICEBEAR_BASE_URL = 'https://api.dicebear.com/7.x/thumbs/svg';
const BACKGROUND_COLOR = '000000'; // Black (dark background)
const TEXT_COLOR = '39FF14'; // Neon green

// Ensure directory exists
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  console.log(`✅ Created directory: ${AVATAR_DIR}`);
}

/**
 * Download a single avatar from DiceBear
 */
function downloadAvatar(initial: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${DICEBEAR_BASE_URL}?seed=${initial}&backgroundColor=${BACKGROUND_COLOR}&color=${TEXT_COLOR}&size=128`;
    const filePath = path.join(AVATAR_DIR, `${initial.toLowerCase()}.svg`);

    // Delete existing file to force re-download with new style
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old ${initial}.svg`);
    }

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${initial}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded ${initial}.svg`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Download all avatars for A-Z initials
 */
async function downloadAllAvatars() {
  console.log('🚀 Starting avatar download...');
  console.log(`📁 Target directory: ${AVATAR_DIR}`);
  console.log(`🎨 Style: ${DICEBEAR_STYLE}`);
  console.log(`🎨 Background: #${BACKGROUND_COLOR} (Black)`);
  console.log(`🎨 Text: #${TEXT_COLOR} (Neon Green)`);
  console.log('');

  const errors: string[] = [];

  for (const initial of INITIALS) {
    try {
      await downloadAvatar(initial);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      const errorMsg = `Failed to download ${initial}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log('');
  if (errors.length === 0) {
    console.log('✅ All avatars downloaded successfully!');
    console.log(`📊 Total: ${INITIALS.length} avatars`);
  } else {
    console.log(`⚠️  Completed with ${errors.length} error(s):`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
}

// Run the script
downloadAllAvatars().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

