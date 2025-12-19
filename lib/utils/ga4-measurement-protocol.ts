/**
 * GA4 Measurement Protocol
 * 
 * Server-side GA4 event tracking using Measurement Protocol API
 * Used for cron jobs and server-side events that can't use client-side gtag
 * 
 * ⚠️ Important: Measurement Protocol events are NOT real-time (5-15 min delay)
 */

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-Z8NSF00GYD';
const GA4_API_SECRET = process.env.GA4_API_SECRET; // Must be set in environment

const MEASUREMENT_PROTOCOL_URL = `https://www.google-analytics.com/mp/collect`;

/**
 * Send event to GA4 via Measurement Protocol
 * 
 * @param clientId - Client ID (can be user_id for authenticated users)
 * @param eventName - Event name (snake_case)
 * @param params - Event parameters
 * @param userId - Optional user ID
 */
export async function sendGA4Event(
  clientId: string,
  eventName: string,
  params: Record<string, any> = {},
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!GA4_API_SECRET) {
    console.warn('⚠️ GA4_API_SECRET not set, skipping Measurement Protocol event');
    return { success: false, error: 'GA4_API_SECRET not configured' };
  }

  try {
    // Sanitize parameters (GA4 has limits)
    const sanitizedParams: Record<string, any> = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (typeof value === 'string' && value.length > 100) {
        sanitizedParams[key] = value.substring(0, 100);
      } else {
        sanitizedParams[key] = value;
      }
    });

    const payload = {
      client_id: clientId,
      user_id: userId,
      events: [
        {
          name: eventName,
          params: sanitizedParams,
        },
      ],
    };

    const url = `${MEASUREMENT_PROTOCOL_URL}?api_secret=${GA4_API_SECRET}&measurement_id=${GA4_MEASUREMENT_ID}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GA4 Measurement Protocol error:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('GA4 Measurement Protocol exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send second_session event
 */
export async function sendSecondSessionEvent(
  userId: string,
  daysSinceSignup: number,
  daysSinceLastSession: number
): Promise<{ success: boolean; error?: string }> {
  return sendGA4Event(
    userId, // Use user_id as client_id for authenticated users
    'second_session',
    {
      days_since_signup: daysSinceSignup,
      days_since_last_session: daysSinceLastSession,
    },
    userId
  );
}

/**
 * Send weekly_active event
 */
export async function sendWeeklyActiveEvent(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return sendGA4Event(
    userId,
    'weekly_active',
    {},
    userId
  );
}

