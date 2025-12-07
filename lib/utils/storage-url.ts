/**
 * Storage URL utilities for handling both Supabase and GCS URLs
 */

/**
 * Check if a URL is from Supabase Storage
 */
export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage');
}

/**
 * Check if a URL is from Google Cloud Storage
 */
export function isGCSUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('storage.googleapis.com') || 
         url.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '');
}

/**
 * Check if URL should use regular img tag (for external URLs)
 * Next.js Image component can have issues with external domains
 */
export function shouldUseRegularImg(url: string | null | undefined): boolean {
  if (!url) return false;
  return isSupabaseUrl(url) || isGCSUrl(url);
}

/**
 * Transform Supabase URL to GCS URL (for migration)
 */
export function transformSupabaseToGCS(supabaseUrl: string, cdnDomain?: string): string {
  // Extract bucket and path from Supabase URL
  // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const match = supabaseUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
  
  if (!match) {
    throw new Error('Invalid Supabase URL format');
  }

  const [, bucket, path] = match;
  
  // Map Supabase bucket names to GCS bucket names
  const gcsBucket = bucket === 'renders' 
    ? (process.env.GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS || 'renderiq-renders')
    : (process.env.GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS || 'renderiq-uploads');

  // Generate GCS URL
  if (cdnDomain) {
    return `https://${cdnDomain}/${gcsBucket}/${path}`;
  }
  
  return `https://storage.googleapis.com/${gcsBucket}/${path}`;
}


