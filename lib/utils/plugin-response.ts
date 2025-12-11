/**
 * Helper utilities for plugin API responses
 */

import { NextResponse } from 'next/server';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Add rate limit headers to NextResponse
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo?: RateLimitInfo
): NextResponse {
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', String(rateLimitInfo.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitInfo.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitInfo.resetTime));
  }
  return response;
}

/**
 * Create a JSON response with rate limit headers
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  rateLimitInfo?: RateLimitInfo
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addRateLimitHeaders(response, rateLimitInfo);
}

