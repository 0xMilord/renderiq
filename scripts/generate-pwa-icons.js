const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Shortcut icons
const shortcutIcons = [
  { size: 96, name: 'shortcut-render.png' },
  { size: 96, name: 'shortcut-gallery.png' },
  { size: 96, name: 'shortcut-dashboard.png' },
];

async function generateIcons() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputDir = path.join(__dirname, '../public/icons');
  
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Check if logo.png exists
    if (!fs.existsSync(inputPath)) {
      console.error('❌ logo.png not found in public directory');
      console.log('Please ensure logo.png is in the public directory');
      return;
    }

    console.log('🎨 Generating PWA icons from logo.png...');

    // Generate main icons
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.name);
      
      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate shortcut icons (same as main icons for now)
    for (const icon of shortcutIcons) {
      const outputPath = path.join(outputDir, icon.name);
      
      await sharp(inputPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate favicon.ico
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);
    
    console.log('✅ Generated favicon.ico');

    // Generate apple-touch-icon
    const appleTouchIconPath = path.join(__dirname, '../public/apple-touch-icon.png');
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(appleTouchIconPath);
    
    console.log('✅ Generated apple-touch-icon.png');

    console.log('\n🎉 All PWA icons generated successfully!');
    console.log('📁 Icons saved to: public/icons/');
    console.log('\n📋 Next steps:');
    console.log('1. Test the PWA by running: npm run dev');
    console.log('2. Open Chrome DevTools > Application > Manifest to verify');
    console.log('3. Test offline functionality by going offline in DevTools');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
generateIcons();
