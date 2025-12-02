#!/usr/bin/env tsx
/**
 * PWA Icon Generator
 * Generates all required PWA icons from logo.svg using Sharp
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOGO_PATH = join(process.cwd(), 'public', 'logo.svg');
const OUTPUT_DIR = join(process.cwd(), 'public', 'icons');

// Required icon sizes for PWA
const ICON_SIZES = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Badge icon for notifications
const BADGE_SIZES = [
  { size: 72, name: 'badge-72x72.png' },
];

// Shortcut icons
const SHORTCUT_SIZES = [
  { size: 96, name: 'shortcut-render.png' },
  { size: 96, name: 'shortcut-gallery.png' },
  { size: 96, name: 'shortcut-dashboard.png' },
];

// Apple touch icon
const APPLE_TOUCH_ICON = { size: 180, name: 'apple-touch-icon.png' };

async function generateIcons() {
  console.log('🎨 Starting PWA icon generation...\n');

  // Check if logo exists
  if (!existsSync(LOGO_PATH)) {
    console.error(`❌ Logo not found at: ${LOGO_PATH}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created directory: ${OUTPUT_DIR}`);
  }

  try {
    // Load the SVG
    const svgBuffer = await sharp(LOGO_PATH).toBuffer();
    console.log(`✅ Loaded logo from: ${LOGO_PATH}\n`);

    // Generate main icons
    console.log('📱 Generating main icons...');
    for (const { size, name } of ICON_SIZES) {
      const outputPath = join(OUTPUT_DIR, name);
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);
      console.log(`  ✅ Generated ${name} (${size}x${size})`);
    }

    // Generate maskable icon (192x192) with padding for safe zone
    console.log('\n🎭 Generating maskable icon...');
    const maskableSize = 192;
    const safeZone = Math.round(maskableSize * 0.8); // 80% safe zone for maskable icons
    const padding = Math.round((maskableSize - safeZone) / 2);
    const maskablePath = join(OUTPUT_DIR, 'icon-192x192.png');
    await sharp(svgBuffer)
      .resize(safeZone, safeZone, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png({ quality: 100 })
      .toFile(maskablePath);
    console.log(`  ✅ Generated maskable icon-192x192.png`);

    // Generate another maskable icon (512x512)
    const maskable512Size = 512;
    const safeZone512 = Math.round(maskable512Size * 0.8);
    const padding512 = Math.round((maskable512Size - safeZone512) / 2);
    const maskable512Path = join(OUTPUT_DIR, 'icon-512x512.png');
    await sharp(svgBuffer)
      .resize(safeZone512, safeZone512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .extend({
        top: padding512,
        bottom: padding512,
        left: padding512,
        right: padding512,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png({ quality: 100 })
      .toFile(maskable512Path);
    console.log(`  ✅ Generated maskable icon-512x512.png`);

    // Generate badge icons
    console.log('\n🔔 Generating badge icons...');
    for (const { size, name } of BADGE_SIZES) {
      const outputPath = join(OUTPUT_DIR, name);
      // Badge icons are typically monochrome or simplified
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .greyscale() // Make it monochrome for badges
        .png({ quality: 100 })
        .toFile(outputPath);
      console.log(`  ✅ Generated ${name} (${size}x${size})`);
    }

    // Generate shortcut icons
    console.log('\n⚡ Generating shortcut icons...');
    for (const { size, name } of SHORTCUT_SIZES) {
      const outputPath = join(OUTPUT_DIR, name);
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      console.log(`  ✅ Generated ${name} (${size}x${size})`);
    }

    // Generate Apple touch icon
    console.log('\n🍎 Generating Apple touch icon...');
    const appleTouchPath = join(process.cwd(), 'public', APPLE_TOUCH_ICON.name);
    await sharp(svgBuffer)
      .resize(APPLE_TOUCH_ICON.size, APPLE_TOUCH_ICON.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for iOS
      })
      .png({ quality: 100 })
      .toFile(appleTouchPath);
    console.log(`  ✅ Generated ${APPLE_TOUCH_ICON.name} (${APPLE_TOUCH_ICON.size}x${APPLE_TOUCH_ICON.size})`);

    // Generate favicon
    console.log('\n⭐ Generating favicon...');
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    console.log(`  ✅ Generated favicon.png`);

    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Verify icons in ${OUTPUT_DIR}`);
    console.log(`   2. Test PWA installation`);
    console.log(`   3. Run Lighthouse PWA audit`);

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the generator
generateIcons();

