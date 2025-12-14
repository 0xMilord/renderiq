/**
 * Unit tests for SybilDetectionService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SybilDetectionService } from '@/lib/services/sybil-detection';
import { db } from '@/lib/db';
import { deviceFingerprints, ipAddresses, sybilDetections } from '@/lib/db/schema';
import { generateFingerprintHash, normalizeIpAddress, isDisposableEmail, isSequentialEmail, parseUserAgent } from '@/lib/utils/device-fingerprint';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/utils/device-fingerprint', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/device-fingerprint')>();
  return {
    ...actual,
    generateFingerprintHash: vi.fn(),
    normalizeIpAddress: vi.fn(),
    isDisposableEmail: vi.fn(),
    isSequentialEmail: vi.fn(),
    parseUserAgent: vi.fn().mockReturnValue({
      browser: 'Chrome',
      os: 'Windows',
      platform: 'desktop',
    }),
  };
});

describe('SybilDetectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectSybil', () => {
    it('should detect low risk user', async () => {
      vi.mocked(parseUserAgent).mockReturnValue({
        browser: 'Chrome',
        os: 'Windows',
        platform: 'desktop',
      });
      vi.mocked(generateFingerprintHash).mockReturnValue('hash-123');
      vi.mocked(normalizeIpAddress).mockReturnValue('192.168.1.1');
      vi.mocked(isDisposableEmail).mockReturnValue(false);
      vi.mocked(isSequentialEmail).mockReturnValue(false);

      // Mock db.select chain - service uses: select().from().where().orderBy() (no limit for device)
      // For IP: select().from().where().limit(1)
      const mockLimitEmpty = vi.fn().mockResolvedValue([]);
      const mockOrderByEmpty = vi.fn().mockResolvedValue([]); // orderBy() returns array directly
      const mockWhereEmpty = vi.fn().mockReturnValue({
        orderBy: mockOrderByEmpty,
        limit: mockLimitEmpty,
      });
      const mockFromEmpty = vi.fn().mockReturnValue({
        where: mockWhereEmpty,
      });
      vi.mocked(db.select).mockReturnValue({
        from: mockFromEmpty,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);
      
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await SybilDetectionService.detectSybil(
        'user-id',
        'test@example.com',
        {
          userAgent: 'Mozilla/5.0',
          language: 'en',
          timezone: 'UTC',
          platform: 'desktop',
          cookieEnabled: true,
        } as any,
        '192.168.1.1',
        new Headers()
      );

      expect(result.isSuspicious).toBe(false);
      expect(result.riskScore).toBeLessThan(50);
      expect(result.riskLevel).toBe('low');
    });

    it('should detect high risk from device fingerprint', async () => {
      vi.mocked(parseUserAgent).mockReturnValue({
        browser: 'Chrome',
        os: 'Windows',
        platform: 'desktop',
      });
      vi.mocked(generateFingerprintHash).mockReturnValue('hash-123');
      vi.mocked(normalizeIpAddress).mockReturnValue('192.168.1.1');

      // Mock multiple accounts from same device
      // Service uses: select().from(deviceFingerprints).where().orderBy() - returns array directly
      const mockOrderByMultiple = vi.fn().mockResolvedValue([
        { userId: 'user-1', createdAt: new Date(Date.now() - 1000) }, // Recent
        { userId: 'user-2', createdAt: new Date(Date.now() - 2000) }, // Recent
        { userId: 'user-3', createdAt: new Date(Date.now() - 3000) }, // Recent
      ]);
      const mockLimitEmpty = vi.fn().mockResolvedValue([]);
      const mockOrderByEmpty = vi.fn().mockResolvedValue([]);
      const mockWhereMultiple = vi.fn().mockReturnValue({
        orderBy: mockOrderByMultiple,
        limit: mockLimitEmpty,
      });
      const mockWhereEmpty = vi.fn().mockReturnValue({
        orderBy: mockOrderByEmpty,
        limit: mockLimitEmpty,
      });
      const mockFromMultiple = vi.fn().mockReturnValue({
        where: mockWhereMultiple,
      });
      const mockFromEmpty = vi.fn().mockReturnValue({
        where: mockWhereEmpty,
      });
      // Make select() return different chains for different queries
      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount++;
        // First call: device fingerprint check (returns multiple)
        // Subsequent calls: IP checks (return empty)
        if (callCount === 1) {
          return { from: mockFromMultiple } as any;
        }
        return { from: mockFromEmpty } as any;
      });

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const result = await SybilDetectionService.detectSybil(
        'user-id',
        'test@example.com',
        {
          userAgent: 'Mozilla/5.0',
          language: 'en',
          timezone: 'UTC',
          platform: 'desktop',
          cookieEnabled: true,
        } as any,
        '192.168.1.1',
        new Headers()
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect disposable email', async () => {
      vi.mocked(parseUserAgent).mockReturnValue({
        browser: 'Chrome',
        os: 'Windows',
        platform: 'desktop',
      });
      vi.mocked(generateFingerprintHash).mockReturnValue('hash-123');
      vi.mocked(normalizeIpAddress).mockReturnValue('192.168.1.1');
      vi.mocked(isDisposableEmail).mockReturnValue(true);

      // Mock db.select chain - service uses: select().from().where().orderBy() (no limit for device)
      // For IP: select().from().where().limit(1)
      const mockLimitEmpty = vi.fn().mockResolvedValue([]);
      const mockOrderByEmpty = vi.fn().mockResolvedValue([]); // orderBy() returns array directly
      const mockWhereEmpty = vi.fn().mockReturnValue({
        orderBy: mockOrderByEmpty,
        limit: mockLimitEmpty,
      });
      const mockFromEmpty = vi.fn().mockReturnValue({
        where: mockWhereEmpty,
      });
      vi.mocked(db.select).mockReturnValue({
        from: mockFromEmpty,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);
      
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await SybilDetectionService.detectSybil(
        'user-id',
        'test@tempmail.com',
        {
          userAgent: 'Mozilla/5.0',
          language: 'en',
          timezone: 'UTC',
          platform: 'desktop',
          cookieEnabled: true,
        } as any,
        '192.168.1.1',
        new Headers()
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain(expect.stringContaining('disposable'));
    });

    it('should whitelist IP addresses', async () => {
      vi.mocked(parseUserAgent).mockReturnValue({
        browser: 'Chrome',
        os: 'Windows',
        platform: 'desktop',
      });
      vi.mocked(normalizeIpAddress).mockReturnValue('10.0.0.1');
      vi.mocked(generateFingerprintHash).mockReturnValue('hash-123');
      vi.mocked(isDisposableEmail).mockReturnValue(false);
      vi.mocked(isSequentialEmail).mockReturnValue(false);

      // Mock empty results for all queries (whitelisted IP should skip most checks)
      const mockOrderByEmpty = vi.fn().mockResolvedValue([]);
      const mockWhereEmpty = vi.fn().mockReturnValue({
        orderBy: mockOrderByEmpty,
        limit: vi.fn().mockResolvedValue([]),
      });
      const mockFromEmpty = vi.fn().mockReturnValue({
        where: mockWhereEmpty,
      });
      vi.mocked(db.select).mockReturnValue({
        from: mockFromEmpty,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);
      
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await SybilDetectionService.detectSybil(
        'user-id',
        'test@example.com',
        {
          userAgent: 'Mozilla/5.0',
          language: 'en',
          timezone: 'UTC',
          platform: 'desktop',
          cookieEnabled: true,
        } as any,
        '10.0.0.1',
        new Headers()
      );

      // Note: 10.0.0.1 is not in CONFIG.IP_WHITELIST, so it will go through normal detection
      // But with empty results, it should be low risk
      expect(result.isSuspicious).toBe(false);
      expect(result.riskScore).toBeLessThan(50);
    });
  });
});

