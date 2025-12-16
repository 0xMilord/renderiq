/**
 * API helper utilities for integration tests
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock Next.js request
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body,
    cookies = {},
  } = options;

  const requestHeaders = new Headers(headers);
  
  // Add cookies to headers
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    requestHeaders.set('Cookie', cookieString);
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    if (typeof body === 'string') {
      requestInit.body = body;
    } else {
      requestInit.body = JSON.stringify(body);
      requestHeaders.set('Content-Type', 'application/json');
    }
  }

  return new NextRequest(url, requestInit);
}

/**
 * Create a mock FormData request
 */
export function createMockFormDataRequest(
  url: string,
  formData: Record<string, string | File>,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'POST',
    headers = {},
    cookies = {},
  } = options;

  const form = new FormData();
  for (const [key, value] of Object.entries(formData)) {
    form.append(key, value);
  }

  const requestHeaders = new Headers(headers);
  
  // Add cookies to headers
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    requestHeaders.set('Cookie', cookieString);
  }

  return new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: form,
  });
}

/**
 * Extract JSON response from Next.js Response
 */
export async function extractJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}








