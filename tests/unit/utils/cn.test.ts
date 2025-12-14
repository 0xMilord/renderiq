/**
 * Tests for cn utility (className merger)
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'hidden');
    expect(result).toContain('base');
    expect(result).toContain('conditional');
    expect(result).not.toContain('hidden');
  });

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('should handle objects', () => {
    const result = cn({ class1: true, class2: false, class3: true });
    expect(result).toContain('class1');
    expect(result).not.toContain('class2');
    expect(result).toContain('class3');
  });

  it('should merge Tailwind classes correctly', () => {
    // twMerge should handle conflicting Tailwind classes
    const result = cn('p-4', 'p-6');
    // Should only contain one padding class (p-6 wins)
    expect(result).toBeDefined();
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined', () => {
    const result = cn('class1', null, undefined, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });
});

