#!/usr/bin/env tsx
/**
 * Use Cases Images Optimizer
 * Converts PNG images to WebP format without quality loss
 */

import sharp from 'sharp';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

const INPUT_DIR = join(process.cwd(), 'public', 'use-cases');
const OUTPUT_DIR = join(process.cwd(), 'public', 'use-cases');

// Expected image files based on use case slugs
const EXPECTED_IMAGES = [
  'concept-renders',
  'material-testing-built-spaces',
  'instant-floor-plan-renders',
  'style-testing-white-renders',
  'rapid-concept-video',
  'massing-testing',
  '2d-elevations-from-images',
  'presentation-ready-graphics',
  'social-media-content',
  'matching-render-mood',
];

async function optimizeImages() {
  console.log('🖼️  Starting use cases images optimization...\n');

  // Check if input directory exists
  if (!existsSync(INPUT_DIR)) {
    console.error(`❌ Directory not found: ${INPUT_DIR}`);
    console.log(`\n💡 Please create the directory and add PNG images first.`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created directory: ${OUTPUT_DIR}\n`);
  }

  try {
    // Get all PNG files in the directory
    const files = readdirSync(INPUT_DIR).filter(file => 
      file.toLowerCase().endsWith('.png')
    );

    if (files.length === 0) {
      console.log('⚠️  No PNG files found in the directory.');
      console.log(`\n📋 Expected files:`);
      EXPECTED_IMAGES.forEach(slug => {
        console.log(`   - ${slug}.png`);
      });
      process.exit(0);
    }

    console.log(`📁 Found ${files.length} PNG file(s) to convert:\n`);

    let convertedCount = 0;
    let skippedCount = 0;

    // Convert each PNG to WebP
    for (const file of files) {
      const inputPath = join(INPUT_DIR, file);
      const baseName = file.replace(/\.png$/i, '');
      const outputPath = join(OUTPUT_DIR, `${baseName}.webp`);

      // Skip if WebP already exists (optional: remove this check to overwrite)
      if (existsSync(outputPath)) {
        console.log(`⏭️  Skipped ${file} (WebP already exists)`);
        skippedCount++;
        continue;
      }

      try {
        // Convert PNG to WebP with lossless quality
        await sharp(inputPath)
          .webp({
            quality: 100, // Maximum quality
            effort: 6, // Higher effort for better compression (0-6)
            lossless: true, // Use lossless encoding for maximum quality
          })
          .toFile(outputPath);

        const stats = await sharp(outputPath).metadata();
        console.log(`✅ Converted: ${file} → ${baseName}.webp`);
        if (stats.width && stats.height) {
          console.log(`   📐 Size: ${stats.width}x${stats.height}px`);
        }

        convertedCount++;
      } catch (error) {
        console.error(`❌ Error converting ${file}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log('\n✨ Conversion complete!');
    console.log(`   ✅ Converted: ${convertedCount} file(s)`);
    if (skippedCount > 0) {
      console.log(`   ⏭️  Skipped: ${skippedCount} file(s) (already exist)`);
    }
    
    // Check for missing files
    const convertedFiles = readdirSync(OUTPUT_DIR)
      .filter(file => file.toLowerCase().endsWith('.webp'))
      .map(file => file.replace(/\.webp$/i, ''));
    
    const missingFiles = EXPECTED_IMAGES.filter(slug => !convertedFiles.includes(slug));
    
    if (missingFiles.length > 0) {
      console.log(`\n⚠️  Missing files (not found in directory):`);
      missingFiles.forEach(slug => {
        console.log(`   - ${slug}.png`);
      });
    }

    console.log(`\n📁 WebP files saved to: ${OUTPUT_DIR}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Verify WebP images look correct`);
    console.log(`   2. Original PNG files can be kept as backup or removed`);
    console.log(`   3. Component will now use .webp extensions`);

  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

// Run the optimizer
optimizeImages();

