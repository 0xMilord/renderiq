# Google Analytics 4 (GA4) Enterprise Implementation Audit & Roadmap

**Date:** 2025-12-27  
**Status:** 🔄 In Progress  
**Priority:** 🔴 Critical (Fundraising Preparation)

---

## Executive Summary

This document provides a comprehensive audit of Renderiq's current Google Analytics implementation and a detailed roadmap for enterprise-grade GA4 tracking optimized for fundraising preparation.

### Current State Assessment

**✅ What's Working:**
- Basic GA4 setup with measurement ID `G-Z8NSF00GYD`
- Google Tag Manager integration (`GTM-T7XGR57L`)
- Basic page view tracking
- Web Vitals tracking (LCP, FID, CLS)
- PWA install event tracking
- SEO monitoring events

**❌ Critical Gaps:**
- **No user identification** - Missing `user_id` configuration
- **No structured business events** - Missing key conversion events
- **No activation tracking** - Can't measure time-to-value
- **No engagement metrics** - Missing second-session, weekly-active tracking
- **No revenue attribution** - Credits/payments not tracked in GA4
- **No funnel analysis** - Can't track user journey
- **No tool usage tracking** - Missing tool-level analytics
- **No render lifecycle tracking** - Missing render creation/completion events

---

## 1. Architecture Overview

### Current Analytics Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Analytics Infrastructure                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GA4 (gtag) │    │  GTM (Tag    │    │   Sentry     │  │
│  │              │    │  Manager)    │    │   Metrics    │  │
│  │  Basic Setup │    │  Basic Setup │    │   (Internal) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  No Centralized │                        │
│                    │  Tracking Layer │                        │
│                    └─────────────────┘                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Internal Analytics (AnalyticsService)               │  │
│  │  - Database-backed usage tracking                     │  │
│  │  - Render statistics                                  │  │
│  │  - Credit statistics                                  │  │
│  │  - API usage statistics                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Enterprise GA4 Analytics Stack                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Centralized GA4 Tracking Utility                      │  │
│  │  (lib/utils/ga4-tracking.ts)                          │  │
│  │  - User identification                                 │  │
│  │  - Event tracking                                      │  │
│  │  - Conversion tracking                                  │  │
│  │  - User properties                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌────▼──────┐      │
│  │   Services  │  │    Actions      │  │   Hooks   │      │
│  │             │  │                 │  │           │      │
│  │ - Auth      │  │ - Auth          │  │ - useAuth │      │
│  │ - Render    │  │ - Render        │  │ - useRenders│     │
│  │ - Billing   │  │ - Billing       │  │ - useCredits│     │
│  │ - Tools     │  │ - Tools         │  │ - useTools│      │
│  │ - Projects  │  │ - Projects      │  │ - useProjects│   │
│  └─────────────┘  └─────────────────┘  └────────────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   GA4 (gtag.js) │                        │
│                    │   + GTM         │                        │
│                    └─────────────────┘                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Server-Side Analytics Jobs (Cron)                    │  │
│  │  - Second session detection                           │  │
│  │  - Weekly active user tracking                         │  │
│  │  - Retention cohort analysis                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Primary Metrics (Single-Source Focus)

**Critical:** Each stage has ONE primary metric that matters most. This tells your future self, collaborators, and investors what actually matters.

| Stage | Primary Metric | Why | Source |
|-------|---------------|-----|--------|
| **Acquisition** | `signup_completed` | Filters curiosity - separates visitors from users | GA4 Conversion |
| **Activation** | `render_activated` | True "aha" moment - user understands value | GA4 Conversion |
| **Retention** | `second_session` | Early habit formation - most predictive of long-term retention | GA4 Conversion (Server-side) |
| **Engagement** | `renders_per_user_per_week` | Depth of usage - not just visits | **DB Only** (derived) |
| **Value** | `credits_spent_per_active_user` | Monetization proxy - shows willingness to pay | **DB Only** (derived) |

**Why This Matters:**
- Focus prevents metric confusion
- VCs will ask: "What's your activation rate?" → Answer: `render_activated` conversion rate
- Derived metrics (renders_per_user, credits_spent) stay in DB - GA tracks behaviors, not aggregates

---

## 3. Key Business Events & Metrics

### 2.1 Acquisition Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `signup_started` | User clicks signup button | `method: 'email' \| 'google'`, `source: string` | No |
| `signup_completed` | User successfully signs up | `method: 'email' \| 'google'`, `source: string`, `user_id: string` | ✅ **YES** |
| `email_verified` | User verifies email | `user_id: string`, `time_to_verify: number` | No |
| `first_login` | User logs in for first time | `method: string`, `user_id: string` | No |

**Implementation Points:**
- `lib/services/auth.ts` - `signUp()`, `signIn()`
- `lib/services/user-onboarding.ts` - `createUserProfile()`
- `app/auth/callback/route.ts` - Email verification

---

### 2.2 Activation Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `first_render_created` | User creates first render (idempotent - guarded at DB level) | `render_id: string`, `type: 'image' \| 'video'`, `platform: string`, `time_to_first_render: number` | ✅ **YES** |
| `first_render_completed` | First render completes successfully (idempotent - guarded at DB level) | `render_id: string`, `type: string`, `quality: string`, `credits_cost: number`, `latency_ms: number` | ✅ **YES** |
| `render_activated` | User refines OR exports first render | `render_id: string`, `action: 'refine' \| 'export'`, `tool: string` | ✅ **YES** |
| `time_to_first_render` | Time from signup to first render | `duration_ms: number`, `duration_bucket: string` | No |

**⚠️ Idempotency Note:**
- `first_*` events are **idempotent and guarded at DB level**
- Check `users.first_render_at IS NULL` before firing
- Prevents duplicate counting on retries

**Activation Definition:**
> User completes first render AND (refines OR exports)

**Implementation Points:**
- `lib/actions/render.actions.ts` - `createRenderAction()`
- `app/api/renders/route.ts` - `handleRenderRequest()`
- `lib/services/render.ts` - `processRenderAsync()`
- `components/tools/base-tool-component.tsx` - `handleGenerate()`

---

### 2.3 Engagement & Retention Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `second_session` | User logs in again within 7 days | `user_id: string`, `days_since_signup: number`, `days_since_last_session: number` | ✅ **YES** |
| `weekly_active` | User has ≥2 sessions OR ≥3 renders in week | `user_id: string` | ✅ **YES** |
| `session_quality` | Best-effort per session (on inactivity timeout, before unload, or after key action) | `renders_this_session: number`, `tools_used: number`, `credits_spent: number`, `duration_bucket: 'short' \| 'medium' \| 'long'` | No |

**⚠️ Important Notes:**
- `daily_active` is **DB-only** (not a GA event) - derived metric, not a behavior
- `weekly_active` is a boolean conversion event - keep parameters minimal
- `session_quality` is **best-effort** (not guaranteed) - GA has no true session end hook
  - Fire on: inactivity timeout (30 min), before unload, or after key action (last render/export)

**Implementation Points:**
- **Server-side cron job** - Check for second session (daily) - uses Measurement Protocol
- **Server-side cron job** - Check for weekly active (weekly) - uses Measurement Protocol
- `lib/services/auth.ts` - `signIn()` - Track session start
- `lib/hooks/use-auth.ts` - Track session end (best-effort)

---

### 2.4 Render Lifecycle Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `render_created` | Render record created | `render_id: string`, `project_id: string`, `type: 'image' \| 'video'`, `platform: 'render' \| 'tools' \| 'canvas' \| 'plugin'`, `quality: string`, `style: string`, `credits_cost: number` | No |
| `render_processing` | Render starts processing | `render_id: string`, `model: string` | No |
| `render_completed` | Render completes successfully | `render_id: string`, `type: string`, `quality: string`, `credits_cost: number`, `latency_ms: number`, `output_size: number` | No |
| `render_failed` | Render fails | `render_id: string`, `error_type: string`, `error_message: string` | No |
| `render_refined` | User refines a render | `render_id: string`, `refinement_type: string`, `credits_cost: number` | No |
| `render_exported` | User exports a render | `render_id: string`, `export_format: string`, `export_size: number` | No |
| `render_downloaded` | User downloads a render | `render_id: string`, `format: string` | No |
| `render_shared` | User shares a render | `render_id: string`, `share_method: string` | No |

**Implementation Points:**
- `lib/actions/render.actions.ts` - `createRenderAction()`
- `lib/services/render.ts` - `processRenderAsync()`
- `app/api/renders/route.ts` - Render status updates
- `lib/services/task-automation.service.ts` - `onRenderExported()`

---

### 2.5 Tool Usage Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `tool_used` | Tool execution started | `tool_id: string`, `tool_name: string`, `tool_category: 'generation' \| 'refine' \| 'convert'`, `input_type: 'image' \| 'text' \| 'mixed'`, `project_id: string` | No |
| `tool_completed` | Tool execution completes | `tool_id: string`, `tool_name: string`, `execution_id: string`, `credits_cost: number`, `latency_ms: number` | No |
| `tool_failed` | Tool execution fails | `tool_id: string`, `tool_name: string`, `error_type: string` | No |

**Implementation Points:**
- `lib/services/tools.service.ts` - `createExecution()`
- `lib/actions/tools.actions.ts` - `createToolExecutionAction()`
- `components/tools/base-tool-component.tsx` - `handleGenerate()`

---

### 2.6 Credits & Revenue Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `credits_earned` | Credits added to account | `amount: number`, `source: 'login' \| 'render' \| 'referral' \| 'purchase' \| 'subscription' \| 'bonus'`, `balance_after: number` | No |
| `credits_spent` | Credits deducted | `amount: number`, `reason: string`, `balance_after: number`, `render_id?: string` | ✅ **YES** |
| `upgrade_clicked` | User clicks upgrade/pricing button | `source_page: string`, `plan_name: string` | ✅ **YES** |
| `payment_initiated` | Payment order created | `amount: number`, `currency: string`, `package_id: string`, `package_type: 'credit_package' \| 'subscription'` | No |
| `payment_completed` | Payment verified | `amount: number`, `currency: string`, `package_id: string`, `credits_added: number` | No |
| `payment_failed` | Payment fails | `amount: number`, `currency: string`, `reason: string` | No |
| `subscription_started` | Subscription activated | `plan_id: string`, `plan_name: string`, `credits_per_month: number` | No |
| `subscription_cancelled` | Subscription cancelled | `plan_id: string`, `reason: string` | No |

**Implementation Points:**
- `lib/services/billing.ts` - `addCredits()`, `deductCredits()`
- `lib/services/razorpay.service.ts` - `createOrder()`, `verifyPayment()`
- `lib/actions/billing.actions.ts` - Credit operations
- `app/api/webhooks/razorpay/route.ts` - Payment webhooks

---

### 2.7 Project & Canvas Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `project_created` | Project created | `project_id: string`, `platform: 'render' \| 'tools' \| 'canvas'`, `has_image: boolean` | No |
| `project_opened` | User opens a project | `project_id: string`, `platform: string`, `is_returning: boolean` | No |
| `canvas_node_added` | Node added to canvas | `node_type: string`, `project_id: string` | No |
| `canvas_workflow_executed` | Canvas workflow runs | `project_id: string`, `node_count: number`, `renders_generated: number` | No |

**Implementation Points:**
- `lib/actions/projects.actions.ts` - `createProject()`
- `lib/services/render.ts` - `createProject()`
- `components/canvas/canvas-editor.tsx` - Canvas interactions

---

### 2.8 API & Plugin Events

| Event Name | Trigger | Parameters | Conversion? |
|------------|---------|------------|-------------|
| `api_key_created` | User creates API key | `platform: string` | No |
| `api_key_used` | API key used for request | `platform: string`, `route: string`, `credits_spent: number` | No |
| `plugin_installed` | Plugin installation detected | `platform: string`, `version: string` | No |
| `plugin_render_created` | Render via plugin API | `platform: string`, `render_id: string` | No |

**Implementation Points:**
- `lib/actions/api-keys.actions.ts` - API key creation
- `app/api/plugins/renders/route.ts` - Plugin API calls
- `app/api/plugins/auth/signin/route.ts` - Plugin auth

---

## 4. User Properties & Custom Dimensions

### 3.1 User Properties (Set on Login)

```typescript
{
  user_id: string,              // Stable user ID (CRITICAL) - event-scoped
  user_role: 'free' | 'paid' | 'admin',  // user-scoped - string - max 100 chars
  signup_source: string,        // user-scoped - 'direct' | 'referral' | 'chatgpt' | 'google' - max 100 chars
  signup_date: string,          // user-scoped - ISO date - max 50 chars
  subscription_status: 'none' | 'active' | 'cancelled',  // user-scoped - string - max 50 chars
  subscription_plan: string | null,  // user-scoped - string - max 100 chars
}
```

**⚠️ Important:**
- **Do NOT include derived metrics** in user properties:
  - ❌ `account_age_days` (compute in DB/cron)
  - ❌ `total_renders` (compute in DB/cron)
  - ❌ `total_credits_spent` (compute in DB/cron)
  - ❌ `last_active_date` (compute in DB/cron)
- GA is not a data warehouse - these are derived metrics, not behaviors
- Keep user properties minimal and static (or update infrequently)

**Custom Dimension Limits:**
- Event-scoped: 50 custom dimensions max
- User-scoped: 25 custom dimensions max
- String values: max 100 characters (GA will truncate silently)
- Numeric values: integers or floats

**Implementation:**
- Set in `lib/utils/ga4-tracking.ts` - `setUserProperties()`
- Called from `lib/services/auth.ts` - `signIn()`
- Updated on key events (subscription changes, role changes)

---

### 3.2 Event Parameters (Standard)

All events should include:
- `user_id` (if authenticated)
- `session_id` (if available)
- `page_path` (current page)
- `page_title` (current page title)
- `timestamp` (ISO string)

---

## 5. Conversion Events (Mark in GA4 UI)

Mark these events as conversions in GA4 Admin → Events:

1. ✅ `signup_completed`
2. ✅ `first_render_completed`
3. ✅ `render_activated`
4. ✅ `second_session`
5. ✅ `weekly_active`
6. ✅ `credits_spent`
7. ✅ `upgrade_clicked`

**Do NOT mark everything** - VCs want clean conversion dashboards.

---

## 6. Funnels (Create in GA4 UI)

### Funnel 1: Activation Funnel
```
Visit → Signup → First Render → Refine/Export
```

### Funnel 2: Habit Formation Funnel
```
Signup → Day 1 Session → Day 3 Session → Day 7 Session
```

### Funnel 3: Value Funnel
```
Render → Credits Spent → Upgrade Click → Payment
```

### Funnel 4: Tool Discovery Funnel
```
First Render → Tool Used → Second Tool Used
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1) 🔴 **CRITICAL**

**Priority:** Must complete before fundraising

1. **Create GA4 Tracking Utility**
   - File: `lib/utils/ga4-tracking.ts`
   - Functions: `initGA4()`, `setUser()`, `trackEvent()`, `setUserProperties()`
   - Type-safe event definitions

2. **Implement User Identification**
   - Set `user_id` on login
   - Set user properties on login
   - Update user properties on key events

3. **Track Core Conversion Events**
   - `signup_completed`
   - `first_render_completed`
   - `render_activated`
   - `credits_spent`

4. **Mark Conversions in GA4 UI**
   - Admin → Events → Mark as conversion

**Files to Modify:**
- `lib/utils/ga4-tracking.ts` (NEW)
- `lib/services/auth.ts`
- `lib/services/user-onboarding.ts`
- `lib/actions/render.actions.ts`
- `app/layout.tsx` (update GA4 config)

---

### Phase 2: Activation & Engagement (Week 2)

1. **Activation Tracking**
   - `time_to_first_render` calculation
   - `render_activated` event (refine OR export)
   - Activation funnel setup

2. **Engagement Tracking**
   - `session_quality` event
   - Session start/end tracking
   - Daily usage tracking

3. **Render Lifecycle**
   - `render_created`, `render_completed`, `render_failed`
   - `render_refined`, `render_exported`
   - Full render tracking

**Files to Modify:**
- `lib/actions/render.actions.ts`
- `lib/services/render.ts`
- `app/api/renders/route.ts`
- `components/tools/base-tool-component.tsx`

---

### Phase 3: Retention & Revenue (Week 3)

1. **Retention Tracking (Server-Side)**
   - Create cron job for `second_session`
   - Create cron job for `weekly_active`
   - Retention cohort analysis

2. **Revenue Tracking**
   - `credits_earned`, `credits_spent`
   - `payment_initiated`, `payment_completed`
   - `upgrade_clicked`
   - Revenue attribution

3. **Tool Usage Tracking**
   - `tool_used`, `tool_completed`
   - Tool-level analytics

**Files to Modify:**
- `lib/services/billing.ts`
- `lib/services/razorpay.service.ts`
- `lib/services/tools.service.ts`
- `app/api/cron/analytics/route.ts` (NEW - cron endpoint)

---

### Phase 4: Advanced Analytics (Week 4+)

1. **Funnel Analysis**
   - Create funnels in GA4 UI
   - Set up custom reports
   - Cohort analysis

2. **Attribution**
   - Signup source tracking
   - Campaign tracking
   - Referral tracking

3. **Performance Optimization**
   - Event batching
   - Server-side tracking for critical events
   - Data quality monitoring

---

## 8. Important Files Reference

### Core Tracking Files

| File | Purpose | Status |
|------|---------|--------|
| `lib/utils/ga4-tracking.ts` | Centralized GA4 tracking utility | ⚠️ **TO CREATE** |
| `app/layout.tsx` | GA4 initialization | ✅ Exists (needs update) |
| `lib/services/auth.ts` | User identification | ✅ Exists (needs GA4 integration) |
| `lib/services/user-onboarding.ts` | Signup tracking | ✅ Exists (needs GA4 integration) |

### Service Integration Points

| Service | Events to Track | File |
|---------|----------------|------|
| Auth | `signup_completed`, `first_login` | `lib/services/auth.ts` |
| Render | `render_created`, `render_completed`, `render_activated` | `lib/actions/render.actions.ts` |
| Billing | `credits_earned`, `credits_spent`, `payment_completed` | `lib/services/billing.ts` |
| Tools | `tool_used`, `tool_completed` | `lib/services/tools.service.ts` |
| Projects | `project_created`, `project_opened` | `lib/actions/projects.actions.ts` |

### Action Integration Points

| Action | Events to Track | File |
|--------|----------------|------|
| `createRenderAction` | `render_created` | `lib/actions/render.actions.ts` |
| `createProject` | `project_created` | `lib/actions/projects.actions.ts` |
| `createToolExecutionAction` | `tool_used` | `lib/actions/tools.actions.ts` |
| `addCredits`, `deductCredits` | `credits_earned`, `credits_spent` | `lib/actions/billing.actions.ts` |

### Hook Integration Points

| Hook | Events to Track | File |
|------|----------------|------|
| `useAuth` | Session tracking | `lib/hooks/use-auth.ts` |
| `useRenders` | Render view tracking | `lib/hooks/use-renders.ts` |
| `useCredits` | Credit balance updates | `lib/hooks/use-credits.ts` |

---

## 9. Server-Side Analytics Jobs

### ⚠️ Measurement Protocol Timing

**Important:** Measurement Protocol events are **NOT real-time**
- Expect 5-15 minute delay before events appear in GA4
- Use DebugView only for client-side events (real-time)
- For server-side events, check GA4 reports after 15+ minutes
- This prevents "why isn't it showing??" panic

### Job 1: Second Session Detection

### Job 1: Second Session Detection

**Frequency:** Daily (cron)

**Logic:**
```typescript
// For each user who signed up in last 7 days
// Check if they logged in again
// If yes, fire `second_session` event via Measurement Protocol
```

**File:** `app/api/cron/analytics/second-session/route.ts` (NEW)

---

### Job 2: Weekly Active Users

**Frequency:** Weekly (cron)

**Logic:**
```typescript
// For each user
// Check if they had ≥2 sessions OR ≥3 renders in last 7 days
// If yes, fire `weekly_active` event
```

**File:** `app/api/cron/analytics/weekly-active/route.ts` (NEW)

---

## 10. Data Privacy & Compliance

### Consent Management

- Implement consent banner (if required by jurisdiction)
- Use GA4 consent mode
- Respect user privacy preferences

### IP Anonymization

- Configure GA4 to anonymize IP addresses
- Set in `gtag('config', 'G-XXXXXXX', { anonymize_ip: true })`

### Data Retention

- Configure data retention settings in GA4
- Default: 14 months (adjust based on needs)

---

## 11. Testing & Validation

### Testing Checklist

- [ ] User ID is set correctly on login
- [ ] User properties are set correctly
- [ ] All conversion events fire correctly
- [ ] Event parameters are correct
- [ ] Funnels are tracking correctly
- [ ] Server-side events (second_session, weekly_active) fire
- [ ] No duplicate events
- [ ] Events appear in GA4 Real-Time reports

### Validation Tools

- GA4 DebugView (chrome://inspect)
- GA4 Real-Time reports
- Google Tag Assistant
- GA4 Measurement Protocol validator

---

## 12. Success Metrics

### Key Metrics to Monitor

1. **Activation Rate**
   - % of signups who complete first render
   - Target: >30%

2. **Time to First Render**
   - Average time from signup to first render
   - Target: <5 minutes

3. **Second Session Rate**
   - % of users who return within 7 days
   - Target: >40%

4. **Weekly Active Rate**
   - % of users active weekly
   - Target: >20%

5. **Credit Spend Rate**
   - % of users who spend credits
   - Target: >50%

---

## 13. Next Steps

### Immediate Actions (This Week)

1. ✅ Create `lib/utils/ga4-tracking.ts`
2. ✅ Implement user identification
3. ✅ Track core conversion events
4. ✅ Mark conversions in GA4 UI
5. ✅ Test and validate

### Short-Term (Next 2 Weeks)

1. Implement activation tracking
2. Implement retention tracking (server-side)
3. Implement revenue tracking
4. Set up funnels in GA4

### Long-Term (Next Month)

1. Advanced funnel analysis
2. Cohort analysis
3. Attribution modeling
4. Performance optimization

---

## Appendix A: Event Naming Convention

**Format:** `object_action` (snake_case)

**Examples:**
- `render_created` ✅
- `credits_spent` ✅
- `user_signup` ✅
- `tool_used` ✅

**Avoid:**
- `createRender` ❌ (camelCase)
- `render-created` ❌ (kebab-case)
- `renderCreated` ❌ (camelCase)

---

## Appendix B: GA4 Measurement Protocol

For server-side events (second_session, weekly_active), use GA4 Measurement Protocol:

```typescript
POST https://www.google-analytics.com/mp/collect?api_secret=XXX&measurement_id=G-XXXXXXX
```

**⚠️ Important Notes:**
- Measurement Protocol events are **NOT real-time** (5-15 min delay)
- Use DebugView only for client-side events
- Server-side events appear in GA4 reports after 15+ minutes
- Store `api_secret` in environment variables (never commit to repo)

**Documentation:** https://developers.google.com/analytics/devguides/collection/protocol/ga4

---

## Appendix D: Data Source of Truth

**⚠️ Critical Disclaimer: GA4 ≠ Billing Source of Truth**

- **GA4** = Behavioral telemetry and conversion tracking
- **Database** = Source of truth for:
  - Credit balances
  - Payment transactions
  - Render counts
  - User statistics
  - Revenue calculations

**Why This Matters:**
- GA4 can have sampling, delays, or data loss
- Never use GA4 data for billing, invoicing, or financial reporting
- Use GA4 for user behavior analysis and conversion funnels
- Use database for all financial and operational metrics

**Example:**
- ✅ GA4: "How many users activated this week?" → Use `render_activated` conversion
- ❌ GA4: "How much revenue did we make?" → Use database `payment_orders` table

---

## Appendix C: References

- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GA4 Best Practices 2025](https://support.google.com/analytics/answer/9267735)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 User Properties](https://developers.google.com/analytics/devguides/collection/ga4/user-properties)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Owner:** Engineering Team  
**Status:** 🔄 Implementation In Progress

