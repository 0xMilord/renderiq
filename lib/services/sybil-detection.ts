/**
 * Sybil Detection Service
 * Multi-factor analysis to detect and prevent sybil attacks
 * Uses device fingerprinting, IP tracking, email patterns, and behavioral analysis
 */

import { db } from '@/lib/db';
import {
  deviceFingerprints,
  ipAddresses,
  sybilDetections,
  accountActivity,
  users,
  userCredits,
} from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import {
  generateFingerprintHash,
  parseUserAgent,
  normalizeIpAddress,
  isDisposableEmail,
  isSequentialEmail,
} from '@/lib/utils/device-fingerprint';
import { getClientIdentifier } from '@/lib/utils/rate-limit';

export interface SybilDetectionResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendedCredits: number; // Reduced credits if suspicious
  linkedAccounts?: string[];
}

export interface DeviceFingerprintInput {
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

// Configuration thresholds
const CONFIG = {
  MAX_ACCOUNTS_PER_DEVICE: 2, // Max accounts from same device in 24h
  MAX_ACCOUNTS_PER_IP: 4, // Max accounts from same IP in 24h (increased to reduce false positives)
  MAX_ACCOUNTS_PER_IP_7DAYS: 6, // Max accounts from same IP in 7 days (increased)
  RISK_THRESHOLDS: {
    MEDIUM: 50,  // Relaxed from 30 to 50 - less strict
    HIGH: 70,    // Relaxed from 50 to 70 - less strict
    CRITICAL: 85, // Relaxed from 70 to 85 - less strict
  },
  INITIAL_CREDITS: {
    TRUSTED: 10,
    LOW: 10,      // Always give 10 credits for low risk
    MEDIUM: 10,   // Relaxed: Give 10 credits instead of 5 for medium risk
    HIGH: 5,      // Relaxed: Give 5 credits instead of 0 for high risk
    CRITICAL: 0,  // Only critical risk gets 0 credits
  },
  // Known proxy/CDN IP ranges (don't penalize)
  TRUSTED_PROXY_HEADERS: ['cf-connecting-ip', 'x-vercel-forwarded-for', 'x-forwarded-for'],
  // IP whitelist for known corporate networks (add as needed)
  IP_WHITELIST: [] as string[],
};

export class SybilDetectionService {
  /**
   * Main detection method - analyzes user signup for sybil patterns
   */
  static async detectSybil(
    userId: string,
    email: string,
    deviceData: DeviceFingerprintInput,
    ipAddress: string,
    requestHeaders: Headers
  ): Promise<SybilDetectionResult> {
    logger.log('🔍 SybilDetection: Analyzing signup for sybil patterns', { userId, email });

    const reasons: string[] = [];
    let riskScore = 0;
    const linkedAccounts: string[] = [];

    // Normalize IP
    const normalizedIp = normalizeIpAddress(ipAddress);

    // Check IP whitelist first (corporate networks, etc.)
    if (CONFIG.IP_WHITELIST.some(whitelisted => normalizedIp.startsWith(whitelisted))) {
      logger.log('✅ SybilDetection: IP is whitelisted, skipping detection');
      return {
        isSuspicious: false,
        riskScore: 0,
        riskLevel: 'low',
        reasons: [],
        recommendedCredits: CONFIG.INITIAL_CREDITS.TRUSTED,
      };
    }

    // 1. Device Fingerprint Analysis
    const fingerprintHash = generateFingerprintHash(deviceData);
    const deviceAnalysis = await this.analyzeDeviceFingerprint(fingerprintHash, userId);
    if (deviceAnalysis.isSuspicious) {
      riskScore += deviceAnalysis.riskScore;
      reasons.push(...deviceAnalysis.reasons);
      if (deviceAnalysis.linkedAccounts) {
        linkedAccounts.push(...deviceAnalysis.linkedAccounts);
      }
    }

    // 2. IP Address Analysis
    const ipAnalysis = await this.analyzeIpAddress(normalizedIp, userId);
    if (ipAnalysis.isSuspicious) {
      riskScore += ipAnalysis.riskScore;
      reasons.push(...ipAnalysis.reasons);
      if (ipAnalysis.linkedAccounts) {
        linkedAccounts.push(...ipAnalysis.linkedAccounts);
      }
    }

    // 3. Email Pattern Analysis
    const emailAnalysis = this.analyzeEmailPattern(email);
    if (emailAnalysis.isSuspicious) {
      riskScore += emailAnalysis.riskScore;
      reasons.push(...emailAnalysis.reasons);
    }

    // 4. Behavioral Analysis (check for rapid signups)
    const behavioralAnalysis = await this.analyzeBehavioralPatterns(normalizedIp, fingerprintHash);
    if (behavioralAnalysis.isSuspicious) {
      riskScore += behavioralAnalysis.riskScore;
      reasons.push(...behavioralAnalysis.reasons);
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore >= CONFIG.RISK_THRESHOLDS.CRITICAL) {
      riskLevel = 'critical';
    } else if (riskScore >= CONFIG.RISK_THRESHOLDS.HIGH) {
      riskLevel = 'high';
    } else if (riskScore >= CONFIG.RISK_THRESHOLDS.MEDIUM) {
      riskLevel = 'medium';
    }

    // Determine recommended credits
    const recommendedCredits = this.getRecommendedCredits(riskLevel);

    const isSuspicious = riskScore >= CONFIG.RISK_THRESHOLDS.MEDIUM;

    // CRITICAL: Store device fingerprint and IP address FIRST, then detection result
    // This ensures foreign keys exist when storing detection result
    await this.storeDeviceFingerprint(userId, deviceData, fingerprintHash);
    await this.storeIpAddress(userId, normalizedIp, requestHeaders);

    // Store detection result AFTER device and IP are stored
    await this.storeDetectionResult(
      userId,
      riskScore,
      riskLevel,
      reasons,
      linkedAccounts,
      fingerprintHash,
      normalizedIp
    );

    logger.log('🔍 SybilDetection: Analysis complete', {
      userId,
      riskScore,
      riskLevel,
      isSuspicious,
      recommendedCredits,
    });

    return {
      isSuspicious,
      riskScore,
      riskLevel,
      reasons,
      recommendedCredits,
      linkedAccounts: linkedAccounts.length > 0 ? linkedAccounts : undefined,
    };
  }

  /**
   * Analyze device fingerprint for duplicate accounts
   */
  private static async analyzeDeviceFingerprint(
    fingerprintHash: string,
    currentUserId: string
  ): Promise<{ isSuspicious: boolean; riskScore: number; reasons: string[]; linkedAccounts?: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check for existing accounts with same fingerprint
      const existingDevices = await db
        .select({
          userId: deviceFingerprints.userId,
          createdAt: deviceFingerprints.createdAt,
        })
        .from(deviceFingerprints)
        .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
        .orderBy(desc(deviceFingerprints.createdAt));

      const linkedAccounts = existingDevices
        .filter(d => d.userId !== currentUserId)
        .map(d => d.userId);

      if (linkedAccounts.length > 0) {
        // Check how many accounts created in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentAccounts = existingDevices.filter(
          d => d.userId !== currentUserId && new Date(d.createdAt) > oneDayAgo
        );

      // Relaxed: Only flag if 3+ accounts from same device (was 2+)
      if (recentAccounts.length >= 3) {
        riskScore += 30; // Reduced from 40
        reasons.push(
          `Multiple accounts (${recentAccounts.length + 1}) created from same device in last 24 hours`
        );
      } else if (recentAccounts.length >= 2) {
        riskScore += 15; // Reduced from 20, only if 2+ accounts
        reasons.push(`Device fingerprint matches ${linkedAccounts.length} existing account(s)`);
      }
      // If only 1 account, don't add risk score (relaxed)
      }

      return {
        isSuspicious: riskScore > 0,
        riskScore,
        reasons,
        linkedAccounts: linkedAccounts.length > 0 ? linkedAccounts : undefined,
      };
    } catch (error) {
      // If database query fails, log and return safe defaults
      logger.error('❌ SybilDetection: Failed to analyze device fingerprint:', error);
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
      };
    }
  }

  /**
   * Analyze IP address for duplicate accounts
   */
  private static async analyzeIpAddress(
    ipAddress: string,
    currentUserId: string
  ): Promise<{ isSuspicious: boolean; riskScore: number; reasons: string[]; linkedAccounts?: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check for existing accounts with same IP
      const existingIps = await db
        .select({
          userId: ipAddresses.userId,
          firstSeenAt: ipAddresses.firstSeenAt,
          isProxy: ipAddresses.isProxy,
          isVpn: ipAddresses.isVpn,
          isTor: ipAddresses.isTor,
        })
        .from(ipAddresses)
        .where(eq(ipAddresses.ipAddress, ipAddress))
        .orderBy(desc(ipAddresses.firstSeenAt));

      const linkedAccounts = existingIps.filter(ip => ip.userId !== currentUserId).map(ip => ip.userId);

      // Check proxy/VPN/Tor (only penalize if combined with other suspicious activity)
      // Don't penalize VPN alone - many legitimate users use VPNs
      const firstIp = existingIps[0];
      // Only add VPN/proxy risk if there are already linked accounts (combining signals)
      if ((firstIp?.isProxy || firstIp?.isVpn || firstIp?.isTor) && linkedAccounts.length > 0) {
        riskScore += 10; // Reduced from 15, only when combined with other signals
        reasons.push('IP address is associated with proxy/VPN/Tor and matches existing accounts');
      }

      // Check accounts from same IP in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAccounts = existingIps.filter(
        ip => ip.userId !== currentUserId && new Date(ip.firstSeenAt) > oneDayAgo
      );

      if (recentAccounts.length >= CONFIG.MAX_ACCOUNTS_PER_IP) {
        riskScore += 35;
        reasons.push(
          `Multiple accounts (${recentAccounts.length + 1}) created from same IP in last 24 hours`
        );
      } else if (recentAccounts.length > 0) {
        riskScore += 15;
        reasons.push(`IP address matches ${linkedAccounts.length} existing account(s)`);
      }

      // Check accounts from same IP in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekAccounts = existingIps.filter(
        ip => ip.userId !== currentUserId && new Date(ip.firstSeenAt) > sevenDaysAgo
      );

      if (weekAccounts.length >= CONFIG.MAX_ACCOUNTS_PER_IP_7DAYS) {
        riskScore += 25;
        reasons.push(
          `Multiple accounts (${weekAccounts.length + 1}) created from same IP in last 7 days`
        );
      }

      return {
        isSuspicious: riskScore > 0,
        riskScore,
        reasons,
        linkedAccounts: linkedAccounts.length > 0 ? linkedAccounts : undefined,
      };
    } catch (error) {
      // If database query fails, log and return safe defaults
      logger.error('❌ SybilDetection: Failed to analyze IP address:', error);
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
      };
    }
  }

  /**
   * Analyze email patterns for suspicious patterns
   */
  private static analyzeEmailPattern(email: string): {
    isSuspicious: boolean;
    riskScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    if (isDisposableEmail(email)) {
      riskScore += 30;
      reasons.push('Disposable/temporary email address detected');
    }

    if (isSequentialEmail(email)) {
      riskScore += 20;
      reasons.push('Email pattern suggests sequential/fake account');
    }

    // Check for common fake email patterns
    const fakePatterns = [
      /^test\d*@/i,
      /^fake\d*@/i,
      /^temp\d*@/i,
      /^user\d+@/i,
      /^demo\d*@/i,
    ];

    if (fakePatterns.some(pattern => pattern.test(email))) {
      riskScore += 15;
      reasons.push('Email pattern matches common fake account patterns');
    }

    return {
      isSuspicious: riskScore > 0,
      riskScore,
      reasons,
    };
  }

  /**
   * Analyze behavioral patterns (rapid signups, etc.)
   */
  private static async analyzeBehavioralPatterns(
    ipAddress: string,
    fingerprintHash: string
  ): Promise<{ isSuspicious: boolean; riskScore: number; reasons: string[] }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      // Check for rapid signups from same IP
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentSignups = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(accountActivity)
        .where(
          and(
            eq(accountActivity.eventType, 'signup'),
            eq(accountActivity.ipAddress, ipAddress),
            gte(accountActivity.createdAt, oneHourAgo)
          )
        );

      const signupCount = Number(recentSignups[0]?.count) || 0;
      if (signupCount > 2) {
        riskScore += 25;
        reasons.push(`Rapid signups detected: ${signupCount} accounts in last hour`);
      }

      return {
        isSuspicious: riskScore > 0,
        riskScore,
        reasons,
      };
    } catch (error) {
      // If database query fails, log and return safe defaults
      logger.error('❌ SybilDetection: Failed to analyze behavioral patterns:', error);
      return {
        isSuspicious: false,
        riskScore: 0,
        reasons: [],
      };
    }
  }

  /**
   * Store device fingerprint
   */
  private static async storeDeviceFingerprint(
    userId: string,
    deviceData: DeviceFingerprintInput,
    fingerprintHash: string
  ): Promise<void> {
    try {
      const { browser, os, platform } = parseUserAgent(deviceData.userAgent);

      // Use transaction to prevent race conditions
      await db.insert(deviceFingerprints).values({
        userId,
        fingerprintHash,
        userAgent: deviceData.userAgent?.substring(0, 500) || '', // Truncate if too long
        browser,
        os,
        screenResolution: deviceData.screenResolution,
        timezone: deviceData.timezone,
        language: deviceData.language,
        platform: deviceData.platform || platform,
        hardwareConcurrency: deviceData.hardwareConcurrency,
        deviceMemory: deviceData.deviceMemory,
      });
      
      logger.log('✅ SybilDetection: Device fingerprint stored', { userId, fingerprintHash });
    } catch (error) {
      // Log error but don't fail signup - fingerprint storage is best effort
      logger.error('❌ SybilDetection: Failed to store device fingerprint:', error);
      // Check if it's a duplicate (race condition) - that's okay
      if (error instanceof Error && (error.message.includes('duplicate') || error.message.includes('unique'))) {
        logger.log('⚠️ SybilDetection: Device fingerprint already exists (race condition)');
      } else {
        // Re-throw if it's not a duplicate - we want to know about other errors
        throw error;
      }
    }
  }

  /**
   * Store IP address (with geolocation if available)
   */
  private static async storeIpAddress(userId: string, ipAddress: string, headers: Headers): Promise<void> {
    try {
      // Check if IP already exists for this user
      const existing = await db
        .select()
        .from(ipAddresses)
        .where(and(eq(ipAddresses.userId, userId), eq(ipAddresses.ipAddress, ipAddress)))
        .limit(1);

      if (existing.length > 0) {
        // Update last seen
        await db
          .update(ipAddresses)
          .set({ lastSeenAt: new Date() })
          .where(eq(ipAddresses.id, existing[0].id));
        return;
      }

      // Detect proxy/VPN from headers (only flag suspicious proxies, not CDNs)
      // Vercel/Cloudflare use x-forwarded-for but are trusted
      const forwardedFor = headers.get('x-forwarded-for');
      const cfConnectingIp = headers.get('cf-connecting-ip');
      const vercelForwarded = headers.get('x-vercel-forwarded-for');
      
      // Only flag as proxy if it's not a trusted CDN/proxy
      const isProxy = forwardedFor !== null && 
                      forwardedFor !== ipAddress && 
                      !cfConnectingIp && 
                      !vercelForwarded &&
                      !CONFIG.TRUSTED_PROXY_HEADERS.some(header => headers.get(header));
      
      const isVpn = false; // Would need external service to check
      const isTor = false; // Would need external service to check

      await db.insert(ipAddresses).values({
        userId,
        ipAddress,
        isProxy,
        isVpn,
        isTor,
      });
      
      logger.log('✅ SybilDetection: IP address stored', { userId, ipAddress });
    } catch (error) {
      // Log error but don't fail signup - IP storage is best effort
      logger.error('❌ SybilDetection: Failed to store IP address:', error);
      // Check if it's a duplicate (race condition) - that's okay
      if (error instanceof Error && (error.message.includes('duplicate') || error.message.includes('unique'))) {
        logger.log('⚠️ SybilDetection: IP address already exists (race condition)');
      } else {
        // Re-throw if it's not a duplicate - we want to know about other errors
        throw error;
      }
    }
  }

  /**
   * Store detection result
   * ✅ OPTIMIZED: Parallelize device and IP lookups
   */
  private static async storeDetectionResult(
    userId: string,
    riskScore: number,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    reasons: string[],
    linkedAccounts: string[],
    fingerprintHash: string,
    ipAddress: string
  ): Promise<void> {
    try {
      // ✅ OPTIMIZED: Parallelize device and IP lookups (2 queries → 1 parallel batch)
      const [device, ip] = await Promise.all([
        db
          .select({ id: deviceFingerprints.id })
          .from(deviceFingerprints)
          .where(
            and(
              eq(deviceFingerprints.fingerprintHash, fingerprintHash),
              eq(deviceFingerprints.userId, userId)
            )
          )
          .orderBy(desc(deviceFingerprints.createdAt))
          .limit(1),
        db
          .select({ id: ipAddresses.id })
          .from(ipAddresses)
          .where(
            and(
              eq(ipAddresses.ipAddress, ipAddress),
              eq(ipAddresses.userId, userId)
            )
          )
          .orderBy(desc(ipAddresses.createdAt))
          .limit(1)
      ]);

      const creditsAwarded = this.getRecommendedCredits(riskLevel);
      
      await db.insert(sybilDetections).values({
        userId,
        riskScore,
        riskLevel,
        detectionReasons: reasons,
        linkedAccounts: linkedAccounts.length > 0 ? linkedAccounts : undefined,
        deviceFingerprintId: device[0]?.id,
        ipAddressId: ip[0]?.id,
        isBlocked: false, // Allow signup but give 0 credits for critical risk
        creditsAwarded,
      });
      
      logger.log('✅ SybilDetection: Detection result stored', {
        userId,
        riskScore,
        riskLevel,
        creditsAwarded,
        deviceId: device[0]?.id,
        ipId: ip[0]?.id,
      });
    } catch (error) {
      logger.error('❌ SybilDetection: Failed to store detection result:', error);
      // Don't throw - allow signup to continue even if storage fails
    }
  }

  /**
   * Get recommended credits based on risk level
   */
  private static getRecommendedCredits(riskLevel: 'low' | 'medium' | 'high' | 'critical'): number {
    return CONFIG.INITIAL_CREDITS[riskLevel.toUpperCase() as keyof typeof CONFIG.INITIAL_CREDITS] || 0;
  }

  /**
   * Record account activity for behavioral analysis
   * ✅ OPTIMIZED: Make device lookup non-blocking if it fails
   */
  static async recordActivity(
    userId: string,
    eventType: 'signup' | 'login' | 'render' | 'credit_purchase' | 'logout',
    ipAddress: string,
    userAgent: string,
    fingerprintHash?: string
  ): Promise<void> {
    try {
      // ✅ OPTIMIZED: Make device lookup fire-and-forget if it fails (non-critical)
      let deviceId: string | undefined;
      if (fingerprintHash) {
        try {
          const deviceResult = await db
            .select({ id: deviceFingerprints.id })
            .from(deviceFingerprints)
            .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
            .limit(1);
          deviceId = deviceResult[0]?.id;
        } catch (error) {
          // Device lookup is optional, don't fail activity recording
          logger.warn('⚠️ SybilDetection: Failed to lookup device fingerprint (non-critical):', error);
        }
      }

      await db.insert(accountActivity).values({
        userId,
        eventType,
        ipAddress: normalizeIpAddress(ipAddress),
        userAgent: userAgent.substring(0, 500),
        deviceFingerprintId: deviceId,
      });
    } catch (error) {
      logger.error('❌ SybilDetection: Failed to record activity:', error);
    }
  }

  /**
   * Check if user should be blocked
   */
  static async isUserBlocked(userId: string): Promise<boolean> {
    const detection = await db
      .select()
      .from(sybilDetections)
      .where(and(eq(sybilDetections.userId, userId), eq(sybilDetections.isBlocked, true)))
      .limit(1);

    return detection.length > 0;
  }
}

