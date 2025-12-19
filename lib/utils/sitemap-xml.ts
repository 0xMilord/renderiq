import { MetadataRoute } from 'next'

/**
 * Converts a MetadataRoute.Sitemap array to XML format
 */
export function generateSitemapXML(sitemap: MetadataRoute.Sitemap): string {
  const urls = sitemap.map((entry) => {
    let url = `  <url>\n    <loc>${escapeXML(entry.url)}</loc>`
    
    if (entry.lastModified) {
      url += `\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>`
    }
    
    if (entry.changeFrequency) {
      url += `\n    <changefreq>${entry.changeFrequency}</changefreq>`
    }
    
    if (entry.priority !== undefined) {
      url += `\n    <priority>${entry.priority}</priority>`
    }
    
    url += `\n  </url>`
    return url
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

/**
 * Escapes XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}






