/**
 * Device Fingerprinting Utility
 * Generates unique device fingerprints to detect sybil attacks
 * Uses multiple browser/device characteristics to create a stable fingerprint
 */

import { createHash } from 'crypto';

export interface DeviceFingerprintData {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution?: string;
  colorDepth?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack?: string;
  plugins?: string;
  canvasFingerprint?: string;
}

/**
 * Generate a stable device fingerprint hash from client-side data
 */
export function generateFingerprintHash(data: DeviceFingerprintData): string {
  // Create a consistent string from all fingerprint data
  const fingerprintString = [
    data.userAgent,
    data.language,
    data.timezone,
    data.screenResolution,
    data.colorDepth,
    data.hardwareConcurrency,
    data.deviceMemory,
    data.platform,
    data.cookieEnabled,
    data.doNotTrack,
    data.plugins,
    data.canvasFingerprint,
  ]
    .filter(Boolean)
    .join('|');

  // Generate SHA-256 hash
  return createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Extract device information from User-Agent string
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  platform: string;
} {
  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('edg')) browser = 'edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'opera';

  // Detect OS
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios';

  // Detect platform
  let platform = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) platform = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) platform = 'tablet';

  return { browser, os, platform };
}

/**
 * Normalize IP address (handle IPv6 and IPv4)
 */
export function normalizeIpAddress(ip: string): string {
  // Remove port if present
  const cleanIp = ip.split(':')[0];
  
  // Handle IPv6 mapped IPv4 addresses (::ffff:192.168.1.1)
  if (cleanIp.startsWith('::ffff:')) {
    return cleanIp.substring(7);
  }
  
  return cleanIp;
}

/**
 * Check if email pattern suggests disposable/temporary email
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
    'temp-mail.org',
    'getnada.com',
    'mohmal.com',
    'fakeinbox.com',
    'trashmail.com',
    'yopmail.com',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chitthi.in',
    'tempmailo.com',
    'dispostable.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.some(d => domain?.includes(d));
}

/**
 * Check if email pattern suggests sequential/fake accounts
 */
export function isSequentialEmail(email: string): boolean {
  // Patterns like user1@gmail.com, user2@gmail.com, test123@gmail.com
  const sequentialPatterns = [
    /^[a-z]+[0-9]+@/i, // user123@
    /^test[0-9]+@/i, // test123@
    /^user[0-9]+@/i, // user123@
    /^temp[0-9]+@/i, // temp123@
    /^fake[0-9]+@/i, // fake123@
  ];

  return sequentialPatterns.some(pattern => pattern.test(email));
}

