/**
 * Google Analytics 4 (GA4) Enterprise Tracking Utility
 * 
 * Centralized, type-safe GA4 event tracking for Renderiq.
 * 
 * Key Principles:
 * - GA4 tracks behaviors, not derived metrics
 * - User properties are minimal and static
 * - Events are idempotent where possible
 * - Fail silently - analytics should never break the app
 * 
 * @see GA4_ENTERPRISE_IMPLEMENTATION_AUDIT.md for full documentation
 */

// GA4 Measurement ID
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-Z8NSF00GYD';

// Type definitions for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Check if GA4 is available (client-side only)
 */
function isGA4Available(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.gtag !== 'undefined' && typeof window.dataLayer !== 'undefined';
}

/**
 * Initialize GA4 with user identification
 * Call this on login to set user_id and user properties
 */
export function initGA4User(userId: string, userProperties?: {
  user_role?: 'free' | 'paid' | 'admin';
  signup_source?: string;
  signup_date?: string;
  subscription_status?: 'none' | 'active' | 'cancelled';
  subscription_plan?: string | null;
}): void {
  if (!isGA4Available()) return;

  try {
    // Set user_id (CRITICAL for cross-device tracking)
    window.gtag('config', GA4_MEASUREMENT_ID, {
      user_id: userId,
      anonymize_ip: true, // Privacy compliance
    });

    // Set user properties (minimal, static properties only)
    if (userProperties) {
      window.gtag('set', 'user_properties', {
        user_role: userProperties.user_role,
        signup_source: userProperties.signup_source,
        signup_date: userProperties.signup_date,
        subscription_status: userProperties.subscription_status,
        subscription_plan: userProperties.subscription_plan || null,
      });
    }
  } catch (error) {
    console.error('GA4: Failed to initialize user', error);
  }
}

/**
 * Clear user identification (on logout)
 */
export function clearGA4User(): void {
  if (!isGA4Available()) return;

  try {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      user_id: null,
    });
  } catch (error) {
    console.error('GA4: Failed to clear user', error);
  }
}

/**
 * Track a GA4 event
 * 
 * @param eventName - Event name (snake_case)
 * @param parameters - Event parameters (will be sanitized)
 * @param userId - Optional user ID (if not already set)
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>,
  userId?: string
): void {
  if (!isGA4Available()) return;

  try {
    // Sanitize parameters (GA4 has limits)
    const sanitizedParams: Record<string, any> = {
      ...parameters,
    };

    // Truncate string values to 100 chars (GA4 limit)
    Object.keys(sanitizedParams).forEach(key => {
      const value = sanitizedParams[key];
      if (typeof value === 'string' && value.length > 100) {
        sanitizedParams[key] = value.substring(0, 100);
      }
    });

    // Add user_id if provided
    if (userId) {
      sanitizedParams.user_id = userId;
    }

    // Add page context if available
    if (typeof window !== 'undefined') {
      sanitizedParams.page_path = window.location.pathname;
      sanitizedParams.page_title = document.title;
    }

    // Fire event
    window.gtag('event', eventName, sanitizedParams);
  } catch (error) {
    console.error(`GA4: Failed to track event ${eventName}`, error);
  }
}

// ============================================================================
// Acquisition Events
// ============================================================================

export function trackSignupStarted(method: 'email' | 'google', source?: string): void {
  trackEvent('signup_started', {
    method,
    source: source || 'direct',
  });
}

export function trackSignupCompleted(
  userId: string,
  method: 'email' | 'google',
  source?: string
): void {
  trackEvent('signup_completed', {
    method,
    source: source || 'direct',
  }, userId);
}

export function trackEmailVerified(userId: string, timeToVerify: number): void {
  trackEvent('email_verified', {
    time_to_verify: timeToVerify,
  }, userId);
}

export function trackFirstLogin(userId: string, method: string): void {
  trackEvent('first_login', {
    method,
  }, userId);
}

// ============================================================================
// Activation Events
// ============================================================================

export function trackFirstRenderCreated(
  userId: string,
  renderId: string,
  type: 'image' | 'video',
  platform: string,
  timeToFirstRender: number
): void {
  trackEvent('first_render_created', {
    render_id: renderId,
    type,
    platform,
    time_to_first_render: timeToFirstRender,
    duration_bucket: getDurationBucket(timeToFirstRender),
  }, userId);
}

export function trackFirstRenderCompleted(
  userId: string,
  renderId: string,
  type: string,
  quality: string,
  creditsCost: number,
  latencyMs: number
): void {
  trackEvent('first_render_completed', {
    render_id: renderId,
    type,
    quality,
    credits_cost: creditsCost,
    latency_ms: latencyMs,
  }, userId);
}

export function trackRenderActivated(
  userId: string,
  renderId: string,
  action: 'refine' | 'export',
  tool?: string
): void {
  trackEvent('render_activated', {
    render_id: renderId,
    action,
    tool: tool || 'unknown',
  }, userId);
}

export function trackTimeToFirstRender(userId: string, durationMs: number): void {
  trackEvent('time_to_first_render', {
    duration_ms: durationMs,
    duration_bucket: getDurationBucket(durationMs),
  }, userId);
}

// ============================================================================
// Engagement & Retention Events
// ============================================================================

export function trackSessionQuality(
  userId: string,
  rendersThisSession: number,
  toolsUsed: number,
  creditsSpent: number,
  durationBucket: 'short' | 'medium' | 'long'
): void {
  trackEvent('session_quality', {
    renders_this_session: rendersThisSession,
    tools_used: toolsUsed,
    credits_spent: creditsSpent,
    duration_bucket: durationBucket,
  }, userId);
}

// Note: second_session and weekly_active are tracked server-side via Measurement Protocol
// See app/api/cron/analytics/ for implementation

// ============================================================================
// Render Lifecycle Events
// ============================================================================

export function trackRenderCreated(
  userId: string,
  renderId: string,
  projectId: string,
  type: 'image' | 'video',
  platform: 'render' | 'tools' | 'canvas' | 'plugin',
  quality: string,
  style: string,
  creditsCost: number
): void {
  trackEvent('render_created', {
    render_id: renderId,
    project_id: projectId,
    type,
    platform,
    quality,
    style,
    credits_cost: creditsCost,
  }, userId);
}

export function trackRenderProcessing(userId: string, renderId: string, model: string): void {
  trackEvent('render_processing', {
    render_id: renderId,
    model,
  }, userId);
}

export function trackRenderCompleted(
  userId: string,
  renderId: string,
  type: string,
  quality: string,
  creditsCost: number,
  latencyMs: number,
  outputSize?: number
): void {
  trackEvent('render_completed', {
    render_id: renderId,
    type,
    quality,
    credits_cost: creditsCost,
    latency_ms: latencyMs,
    output_size: outputSize,
  }, userId);
}

export function trackRenderFailed(
  userId: string,
  renderId: string,
  errorType: string,
  errorMessage: string
): void {
  trackEvent('render_failed', {
    render_id: renderId,
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Truncate for GA4
  }, userId);
}

export function trackRenderRefined(
  userId: string,
  renderId: string,
  refinementType: string,
  creditsCost: number
): void {
  trackEvent('render_refined', {
    render_id: renderId,
    refinement_type: refinementType,
    credits_cost: creditsCost,
  }, userId);
}

export function trackRenderExported(
  userId: string,
  renderId: string,
  exportFormat: string,
  exportSize?: number
): void {
  trackEvent('render_exported', {
    render_id: renderId,
    export_format: exportFormat,
    export_size: exportSize,
  }, userId);
}

export function trackRenderDownloaded(userId: string, renderId: string, format: string): void {
  trackEvent('render_downloaded', {
    render_id: renderId,
    format,
  }, userId);
}

export function trackRenderShared(userId: string, renderId: string, shareMethod: string): void {
  trackEvent('render_shared', {
    render_id: renderId,
    share_method: shareMethod,
  }, userId);
}

// ============================================================================
// Tool Usage Events
// ============================================================================

export function trackToolUsed(
  userId: string,
  toolId: string,
  toolName: string,
  toolCategory: 'generation' | 'refine' | 'convert',
  inputType: 'image' | 'text' | 'mixed',
  projectId: string
): void {
  trackEvent('tool_used', {
    tool_id: toolId,
    tool_name: toolName,
    tool_category: toolCategory,
    input_type: inputType,
    project_id: projectId,
  }, userId);
}

export function trackToolCompleted(
  userId: string,
  toolId: string,
  toolName: string,
  executionId: string,
  creditsCost: number,
  latencyMs: number
): void {
  trackEvent('tool_completed', {
    tool_id: toolId,
    tool_name: toolName,
    execution_id: executionId,
    credits_cost: creditsCost,
    latency_ms: latencyMs,
  }, userId);
}

export function trackToolFailed(
  userId: string,
  toolId: string,
  toolName: string,
  errorType: string
): void {
  trackEvent('tool_failed', {
    tool_id: toolId,
    tool_name: toolName,
    error_type: errorType,
  }, userId);
}

// ============================================================================
// Credits & Revenue Events
// ============================================================================

export function trackCreditsEarned(
  userId: string,
  amount: number,
  source: 'login' | 'render' | 'referral' | 'purchase' | 'subscription' | 'bonus',
  balanceAfter: number
): void {
  trackEvent('credits_earned', {
    amount,
    source,
    balance_after: balanceAfter,
  }, userId);
}

export function trackCreditsSpent(
  userId: string,
  amount: number,
  reason: string,
  balanceAfter: number,
  renderId?: string
): void {
  trackEvent('credits_spent', {
    amount,
    reason,
    balance_after: balanceAfter,
    render_id: renderId,
  }, userId);
}

export function trackUpgradeClicked(sourcePage: string, planName: string): void {
  trackEvent('upgrade_clicked', {
    source_page: sourcePage,
    plan_name: planName,
  });
}

export function trackPaymentInitiated(
  userId: string,
  amount: number,
  currency: string,
  packageId: string,
  packageType: 'credit_package' | 'subscription'
): void {
  trackEvent('payment_initiated', {
    amount,
    currency,
    package_id: packageId,
    package_type: packageType,
  }, userId);
}

export function trackPaymentCompleted(
  userId: string,
  amount: number,
  currency: string,
  packageId: string,
  creditsAdded: number
): void {
  trackEvent('payment_completed', {
    amount,
    currency,
    package_id: packageId,
    credits_added: creditsAdded,
  }, userId);
}

export function trackPaymentFailed(
  userId: string,
  amount: number,
  currency: string,
  reason: string
): void {
  trackEvent('payment_failed', {
    amount,
    currency,
    reason: reason.substring(0, 100),
  }, userId);
}

export function trackSubscriptionStarted(
  userId: string,
  planId: string,
  planName: string,
  creditsPerMonth: number
): void {
  trackEvent('subscription_started', {
    plan_id: planId,
    plan_name: planName,
    credits_per_month: creditsPerMonth,
  }, userId);
}

export function trackSubscriptionCancelled(userId: string, planId: string, reason: string): void {
  trackEvent('subscription_cancelled', {
    plan_id: planId,
    reason: reason.substring(0, 100),
  }, userId);
}

// ============================================================================
// Project & Canvas Events
// ============================================================================

export function trackProjectCreated(
  userId: string,
  projectId: string,
  platform: 'render' | 'tools' | 'canvas',
  hasImage: boolean
): void {
  trackEvent('project_created', {
    project_id: projectId,
    platform,
    has_image: hasImage,
  }, userId);
}

export function trackProjectOpened(
  userId: string,
  projectId: string,
  platform: string,
  isReturning: boolean
): void {
  trackEvent('project_opened', {
    project_id: projectId,
    platform,
    is_returning: isReturning,
  }, userId);
}

export function trackCanvasNodeAdded(userId: string, nodeType: string, projectId: string): void {
  trackEvent('canvas_node_added', {
    node_type: nodeType,
    project_id: projectId,
  }, userId);
}

export function trackCanvasWorkflowExecuted(
  userId: string,
  projectId: string,
  nodeCount: number,
  rendersGenerated: number
): void {
  trackEvent('canvas_workflow_executed', {
    project_id: projectId,
    node_count: nodeCount,
    renders_generated: rendersGenerated,
  }, userId);
}

// ============================================================================
// API & Plugin Events
// ============================================================================

export function trackApiKeyCreated(userId: string, platform: string): void {
  trackEvent('api_key_created', {
    platform,
  }, userId);
}

export function trackApiKeyUsed(
  userId: string,
  platform: string,
  route: string,
  creditsSpent: number
): void {
  trackEvent('api_key_used', {
    platform,
    route,
    credits_spent: creditsSpent,
  }, userId);
}

export function trackPluginInstalled(platform: string, version: string): void {
  trackEvent('plugin_installed', {
    platform,
    version,
  });
}

export function trackPluginRenderCreated(userId: string, platform: string, renderId: string): void {
  trackEvent('plugin_render_created', {
    platform,
    render_id: renderId,
  }, userId);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get duration bucket for time-based metrics
 */
function getDurationBucket(durationMs: number): string {
  const seconds = durationMs / 1000;
  if (seconds < 120) return '<2min';
  if (seconds < 300) return '2-5min';
  if (seconds < 600) return '5-10min';
  return '>10min';
}

/**
 * Get session duration bucket
 */
export function getSessionDurationBucket(durationMs: number): 'short' | 'medium' | 'long' {
  const minutes = durationMs / (1000 * 60);
  if (minutes < 5) return 'short';
  if (minutes < 30) return 'medium';
  return 'long';
}

