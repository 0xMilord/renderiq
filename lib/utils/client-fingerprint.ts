/**
 * Client-side Device Fingerprinting
 * Collects device characteristics for sybil detection
 * Should be called before signup/login
 */

export interface ClientFingerprintData {
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
 * Generate canvas fingerprint (browser-specific rendering)
 */
function generateCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device fingerprint', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

/**
 * Collect device fingerprint data from browser
 */
export function collectDeviceFingerprint(): ClientFingerprintData {
  const nav = navigator;
  const screen = window.screen;

  return {
    userAgent: nav.userAgent,
    language: nav.language || nav.languages?.[0] || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: (nav as any).deviceMemory,
    platform: nav.platform,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack || undefined,
    plugins: Array.from(nav.plugins || [])
      .map(p => p.name)
      .join(','),
    canvasFingerprint: generateCanvasFingerprint(),
  };
}

/**
 * Store fingerprint in cookie (for OAuth flow)
 */
export function storeFingerprintInCookie(fingerprintData: ClientFingerprintData): void {
  try {
    const data = JSON.stringify(fingerprintData);
    // Store in cookie (expires in 1 hour)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `device_fingerprint=${encodeURIComponent(data)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    
    // Also store timezone separately for easier access
    document.cookie = `timezone=${encodeURIComponent(fingerprintData.timezone)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to store fingerprint in cookie:', error);
  }
}

/**
 * Get fingerprint from cookie
 */
export function getFingerprintFromCookie(): ClientFingerprintData | null {
  try {
    const cookies = document.cookie.split(';');
    const fingerprintCookie = cookies.find(c => c.trim().startsWith('device_fingerprint='));
    
    if (!fingerprintCookie) return null;
    
    const data = decodeURIComponent(fingerprintCookie.split('=')[1]);
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Send fingerprint to server and get hash
 */
export async function sendFingerprintToServer(
  fingerprintData: ClientFingerprintData
): Promise<{ fingerprintHash: string; deviceInfo: any } | null> {
  try {
    const response = await fetch('/api/device-fingerprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fingerprintData),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.success ? result : null;
  } catch (error) {
    console.error('Failed to send fingerprint to server:', error);
    return null;
  }
}

