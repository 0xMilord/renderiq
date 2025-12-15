import { MetadataRoute } from 'next'

// Use Node.js runtime for sitemap generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// Helper to get all docs - read JSON files directly
function getAllDocs(): any[] {
  try {
    const path = require('path');
    const fs = require('fs');
    const docDir = path.join(process.cwd(), '.contentlayer', 'generated', 'Doc');
    
    // Check if directory exists
    if (!fs.existsSync(docDir)) {
      console.warn('⚠️ Generated docs directory not found at:', docDir);
      return [];
    }
    
    // Read all JSON files from the Doc directory (exclude _index.json)
    const jsonFiles = fs.readdirSync(docDir).filter((file: string) => 
      file.endsWith('.json') && file !== '_index.json'
    );
    
    if (jsonFiles.length === 0) {
      console.warn('⚠️ No JSON files found in generated docs directory');
      return [];
    }
    
    // Load all doc JSON files
    const docs = jsonFiles.map((file: string) => {
      const filePath = path.join(docDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content;
    });
    
    return docs;
  } catch (error: any) {
    console.error('❌ Error loading docs:', error?.message || error);
    return [];
  }
}

export default async function sitemapDocs(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Docs index page
  const docsIndex = {
    url: `${baseUrl}/docs`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  };

  // Get all docs
  const docs = getAllDocs();
  
  // Individual doc pages
  const docPages = docs.map((doc: any) => {
    const slug = doc.slug || doc._raw?.flattenedPath || '';
    const docUrl = slug ? `${baseUrl}/docs/${slug}` : `${baseUrl}/docs`;
    
    return {
      url: docUrl,
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  return [docsIndex, ...docPages];
}







