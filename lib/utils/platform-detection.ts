/**
 * Platform Detection Utility
 * Detects the source platform of plugin API requests
 */

import { NextRequest } from 'next/server';

export type PluginPlatform =
  | 'sketchup'
  | 'revit'
  | 'autocad'
  | 'rhino'
  | 'archicad'
  | 'blender'
  | 'unknown';

export interface PlatformInfo {
  platform: PluginPlatform;
  version?: string;
  userAgent?: string;
}

/**
 * Detect plugin platform from request headers
 * Checks User-Agent header and X-Renderiq-Platform header
 */
export function detectPlatform(request: NextRequest): PlatformInfo {
  const userAgent = request.headers.get('user-agent') || '';
  const platformHeader = request.headers.get('x-renderiq-platform')?.toLowerCase();

  // Check explicit platform header first (most reliable)
  if (platformHeader) {
    const validPlatforms: PluginPlatform[] = [
      'sketchup',
      'revit',
      'autocad',
      'rhino',
      'archicad',
      'blender',
    ];

    if (validPlatforms.includes(platformHeader as PluginPlatform)) {
      return {
        platform: platformHeader as PluginPlatform,
        userAgent,
      };
    }
  }

  // Fallback to User-Agent detection
  const ua = userAgent.toLowerCase();

  // SketchUp detection
  if (ua.includes('sketchup') || ua.includes('renderiq-sketchup')) {
    const versionMatch = userAgent.match(/SketchUp[\/\s]?(\d+\.?\d*)/i);
    return {
      platform: 'sketchup',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // Revit detection
  if (ua.includes('revit') || ua.includes('renderiq-revit')) {
    const versionMatch = userAgent.match(/Revit[\/\s]?(\d+)/i);
    return {
      platform: 'revit',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // AutoCAD detection
  if (ua.includes('autocad') || ua.includes('renderiq-autocad')) {
    const versionMatch = userAgent.match(/AutoCAD[\/\s]?(\d+)/i);
    return {
      platform: 'autocad',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // Rhino detection
  if (ua.includes('rhino') || ua.includes('renderiq-rhino')) {
    const versionMatch = userAgent.match(/Rhino[\/\s]?(\d+\.?\d*)/i);
    return {
      platform: 'rhino',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // ArchiCAD detection
  if (ua.includes('archicad') || ua.includes('renderiq-archicad')) {
    const versionMatch = userAgent.match(/ArchiCAD[\/\s]?(\d+)/i);
    return {
      platform: 'archicad',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // Blender detection
  if (ua.includes('blender') || ua.includes('renderiq-blender')) {
    const versionMatch = userAgent.match(/Blender[\/\s]?(\d+\.?\d*)/i);
    return {
      platform: 'blender',
      version: versionMatch?.[1],
      userAgent,
    };
  }

  // Default to unknown
  return {
    platform: 'unknown',
    userAgent,
  };
}

/**
 * Check if request is from a plugin (not web browser)
 */
export function isPluginRequest(request: NextRequest): boolean {
  const platform = detectPlatform(request);
  return platform.platform !== 'unknown';
}

/**
 * Get platform-specific rate limits
 * Different platforms may have different rate limits
 */
export function getPlatformRateLimit(platform: PluginPlatform): {
  maxRequests: number;
  windowMs: number;
} {
  // Default rate limits
  const defaults = {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
  };

  // Platform-specific rate limits
  const platformLimits: Record<PluginPlatform, { maxRequests: number; windowMs: number }> = {
    sketchup: { maxRequests: 30, windowMs: 60000 },
    revit: { maxRequests: 20, windowMs: 60000 }, // Revit users may make fewer requests
    autocad: { maxRequests: 20, windowMs: 60000 },
    rhino: { maxRequests: 30, windowMs: 60000 },
    archicad: { maxRequests: 20, windowMs: 60000 },
    blender: { maxRequests: 30, windowMs: 60000 },
    unknown: defaults,
  };

  return platformLimits[platform] || defaults;
}

/**
 * Normalize platform name for database storage
 * Maps plugin platforms to the platform enum used in schema
 */
export function normalizePlatformForDB(platform: PluginPlatform): 'render' | 'tools' | 'canvas' {
  // Plugin platforms map to 'render' platform in the database
  // This maintains compatibility with existing schema
  return 'render';
}

