#!/usr/bin/env node

/**
 * PWA Placeholder Assets Generator
 * 
 * This script generates placeholder images for missing PWA assets.
 * Replace these with actual images once available.
 * 
 * Usage: node scripts/generate-placeholder-assets.js
 * 
 * Note: Requires sharp or canvas library for image generation
 * Install: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('⚠️  Sharp library not found. Install with: npm install sharp');
  console.error('   Or use the manual generation guide in scripts/generate-pwa-assets.md');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const screenshotsDir = path.join(publicDir, 'screenshots');
const splashDir = path.join(publicDir, 'splash');

// Colors
const backgroundColor = '#121212'; // Dark background
const foregroundColor = '#D1F24A'; // Brand color (lime green)
const textColor = '#FFFFFF';

/**
 * Create a simple placeholder image
 */
async function createPlaceholderImage(outputPath, width, height, label = '') {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${Math.min(width, height) / 10}" 
        fill="${foregroundColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${label || `${width}x${height}`}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Created: ${path.relative(publicDir, outputPath)}`);
}

/**
 * Generate Windows icons
 */
async function generateWindowsIcons() {
  console.log('\n📦 Generating Windows Icons...');
  
  const windowsIcons = [
    { size: 310, name: 'icon-310x310.png' },
    { size: 150, name: 'icon-150x150.png' },
    { size: 70, name: 'icon-70x70.png' },
  ];

  for (const icon of windowsIcons) {
    const outputPath = path.join(iconsDir, icon.name);
    if (!fs.existsSync(outputPath)) {
      await createPlaceholderImage(outputPath, icon.size, icon.size, 'Icon');
    } else {
      console.log(`⏭️  Skipped (exists): ${icon.name}`);
    }
  }

  // Wide icon (310x150)
  const wideIconPath = path.join(iconsDir, 'icon-310x150.png');
  if (!fs.existsSync(wideIconPath)) {
    await createPlaceholderImage(wideIconPath, 310, 150, 'Wide');
  } else {
    console.log(`⏭️  Skipped (exists): icon-310x150.png`);
  }
}

/**
 * Generate screenshots
 */
async function generateScreenshots() {
  console.log('\n📸 Generating Screenshots...');
  
  const screenshots = [
    { width: 1280, height: 720, name: 'desktop-1.png', label: 'Desktop' },
    { width: 750, height: 1334, name: 'mobile-1.png', label: 'Mobile' },
  ];

  for (const screenshot of screenshots) {
    const outputPath = path.join(screenshotsDir, screenshot.name);
    if (!fs.existsSync(outputPath)) {
      await createPlaceholderImage(
        outputPath, 
        screenshot.width, 
        screenshot.height, 
        screenshot.label
      );
    } else {
      console.log(`⏭️  Skipped (exists): ${screenshot.name}`);
    }
  }
}

/**
 * Generate iOS splash screens
 */
async function generateSplashScreens() {
  console.log('\n🍎 Generating iOS Splash Screens...');
  
  const splashScreens = [
    { width: 640, height: 1136, name: 'apple-splash-640x1136.png' },
    { width: 750, height: 1334, name: 'apple-splash-750x1334.png' },
    { width: 828, height: 1792, name: 'apple-splash-828x1792.png' },
    { width: 1125, height: 2436, name: 'apple-splash-1125x2436.png' },
    { width: 1242, height: 2208, name: 'apple-splash-1242x2208.png' },
    { width: 1242, height: 2688, name: 'apple-splash-1242x2688.png' },
    { width: 1536, height: 2048, name: 'apple-splash-1536x2048.png' },
    { width: 1668, height: 2224, name: 'apple-splash-1668x2224.png' },
    { width: 1668, height: 2388, name: 'apple-splash-1668x2388.png' },
    { width: 2048, height: 2732, name: 'apple-splash-2048x2732.png' },
  ];

  for (const splash of splashScreens) {
    const outputPath = path.join(splashDir, splash.name);
    if (!fs.existsSync(outputPath)) {
      await createPlaceholderImage(
        outputPath, 
        splash.width, 
        splash.height, 
        'Renderiq'
      );
    } else {
      console.log(`⏭️  Skipped (exists): ${splash.name}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 PWA Placeholder Assets Generator\n');
  console.log('⚠️  This generates PLACEHOLDER images. Replace with actual assets!\n');

  // Ensure directories exist
  [iconsDir, screenshotsDir, splashDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${path.relative(publicDir, dir)}`);
    }
  });

  try {
    await generateWindowsIcons();
    await generateScreenshots();
    await generateSplashScreens();
    
    console.log('\n✅ Placeholder generation complete!');
    console.log('⚠️  Remember to replace placeholder images with actual assets.');
    console.log('📖 See scripts/generate-pwa-assets.md for generation guide.');
  } catch (error) {
    console.error('\n❌ Error generating assets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateWindowsIcons, generateScreenshots, generateSplashScreens };







