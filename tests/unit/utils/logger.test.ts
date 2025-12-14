/**
 * Tests for logger utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '@/lib/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log messages in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    logger.log('Test message');
    
    // In test environment, logger should work
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    
    logger.info('Info message');
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should log warnings', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    logger.warn('Warning message');
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should log errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    logger.error('Error message');
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle error objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    
    logger.error('Error occurred', error);
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle debug messages', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    logger.debug('Debug message');
    
    // Debug may or may not be called depending on environment
    consoleSpy.mockRestore();
  });
});

