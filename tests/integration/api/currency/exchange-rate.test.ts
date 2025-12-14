/**
 * Integration tests for /api/currency/exchange-rate route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/currency/exchange-rate/route';

describe('GET /api/currency/exchange-rate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return exchange rate', async () => {
    const request = new NextRequest('http://localhost:3000/api/currency/exchange-rate?currency=USD');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.currency).toBe('USD');
    expect(data.rate).toBeDefined();
  });

  it('should return 1 for base currency', async () => {
    const request = new NextRequest('http://localhost:3000/api/currency/exchange-rate?currency=INR');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rate).toBe(1);
  });

  it('should use cached rates', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/currency/exchange-rate?currency=USD');
    const request2 = new NextRequest('http://localhost:3000/api/currency/exchange-rate?currency=USD');

    const response1 = await GET(request1);
    const response2 = await GET(request2);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1.rate).toBe(data2.rate);
  });
});

