import * as fs from 'fs';
import * as path from 'path';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Remove authorImage fields from all blog MDX files
 * This ensures they use the DiceBear avatars based on author initials
 */
function updateBlogFiles() {
  const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.mdx'));
  
  console.log(`📝 Found ${files.length} blog files to process\n`);

  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if file has authorImage field
    if (content.includes('authorImage:')) {
      // Remove the authorImage line (handles various formats)
      // Match: authorImage: followed by any characters until newline, including spaces
      content = content.replace(/authorImage:\s*[^\r\n]+\r?\n/g, '');
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Updated ${file}`);
      updatedCount++;
    }
  }

  console.log(`\n✨ Done! Updated ${updatedCount} files`);
}

updateBlogFiles();

