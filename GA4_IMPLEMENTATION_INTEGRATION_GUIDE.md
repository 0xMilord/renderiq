# GA4 Implementation Integration Guide

**Status:** 🔄 In Progress  
**Last Updated:** 2025-01-27

This guide documents where GA4 tracking has been integrated and what remains to be done.

---

## ✅ Completed Integrations

### 1. Core Infrastructure
- ✅ `lib/utils/ga4-tracking.ts` - Centralized tracking utility created
- ✅ `app/layout.tsx` - GA4 config updated with `anonymize_ip: true`

### 2. Auth & Onboarding
- ⚠️ **PENDING:** Client-side tracking in signup/login flows
  - Need to add `trackSignupStarted()` in signup page
  - Need to add `trackSignupCompleted()` after profile creation (client-side)
  - Need to add `trackFirstLogin()` in auth service (check if first login)

---

## 🔄 In Progress

### 3. Render Tracking
- ⚠️ **PENDING:** Add tracking to render actions
  - `trackRenderCreated()` - After render record created
  - `trackFirstRenderCreated()` - If `users.first_render_at IS NULL`
  - `trackRenderCompleted()` - After render completes
  - `trackFirstRenderCompleted()` - If first render
  - `trackRenderActivated()` - When user refines/exports first render

**Files to Modify:**
- `lib/actions/render.actions.ts` - `createRenderAction()`
- `lib/services/render.ts` - `processRenderAsync()`
- `lib/services/task-automation.service.ts` - `onRenderExported()`

### 4. Billing & Credits
- ⚠️ **PENDING:** Add tracking to credit operations
  - `trackCreditsEarned()` - In `BillingService.addCredits()`
  - `trackCreditsSpent()` - In `BillingService.deductCredits()`
  - `trackPaymentCompleted()` - In payment webhooks
  - `trackUpgradeClicked()` - In pricing/upgrade buttons

**Files to Modify:**
- `lib/services/billing.ts` - `addCredits()`, `deductCredits()`
- `lib/services/razorpay.service.ts` - `verifyPayment()`
- `app/api/webhooks/razorpay/route.ts` - Payment webhook
- Pricing/upgrade components - Add click tracking

### 5. Tools Tracking
- ⚠️ **PENDING:** Add tracking to tool executions
  - `trackToolUsed()` - When tool execution starts
  - `trackToolCompleted()` - When tool completes
  - `trackToolFailed()` - When tool fails

**Files to Modify:**
- `lib/services/tools.service.ts` - `createExecution()`, `updateExecutionStatus()`
- `lib/actions/tools.actions.ts` - `createToolExecutionAction()`

### 6. Projects Tracking
- ⚠️ **PENDING:** Add tracking to project operations
  - `trackProjectCreated()` - After project created
  - `trackProjectOpened()` - When user opens project

**Files to Modify:**
- `lib/actions/projects.actions.ts` - `createProject()`
- Project view components - Track project opened

---

## 📋 Server-Side Tracking (Measurement Protocol)

### 7. Retention Tracking (Cron Jobs)
- ⚠️ **PENDING:** Create server-side cron jobs
  - `second_session` - Daily cron to detect second session
  - `weekly_active` - Weekly cron to detect weekly active users

**Files to Create:**
- `app/api/cron/analytics/second-session/route.ts`
- `app/api/cron/analytics/weekly-active/route.ts`

**Environment Variables Needed:**
- `GA4_MEASUREMENT_ID` - Already set (G-Z8NSF00GYD)
- `GA4_API_SECRET` - Need to create in GA4 Admin → Data Streams → Measurement Protocol API secrets

---

## 🎯 Implementation Priority

### Phase 1: Critical (This Week) 🔴
1. ✅ Core tracking utility (`lib/utils/ga4-tracking.ts`)
2. ⚠️ Render tracking (render_created, render_completed, first_render_*)
3. ⚠️ Credits tracking (credits_spent, credits_earned)
4. ⚠️ Signup/login tracking (signup_completed, first_login)

### Phase 2: Important (Next Week) 🟡
5. ⚠️ Server-side retention tracking (second_session, weekly_active)
6. ⚠️ Tool usage tracking
7. ⚠️ Project tracking
8. ⚠️ Payment tracking

### Phase 3: Nice to Have (Later) 🟢
9. Canvas tracking
10. API/Plugin tracking
11. Advanced funnel analysis

---

## 📝 Integration Patterns

### Pattern 1: Client-Side After Server Action

```typescript
// In component/hook after server action completes
const result = await createRenderAction(formData);
if (result.success && result.data) {
  // Track client-side
  trackRenderCreated(
    user.id,
    result.data.renderId,
    result.data.type,
    result.data.platform,
    result.data.quality,
    result.data.style,
    result.data.creditsCost
  );
}
```

### Pattern 2: Server-Side (Non-Blocking)

```typescript
// In server action/service (fire-and-forget)
try {
  // ... main logic ...
  
  // Track non-blocking (don't await)
  if (typeof window !== 'undefined') {
    trackCreditsSpent(userId, amount, reason, balanceAfter);
  }
} catch (error) {
  // Handle error
}
```

### Pattern 3: Server-Side Measurement Protocol

```typescript
// In cron job (server-side only)
import { sendGA4Event } from '@/lib/utils/ga4-measurement-protocol';

await sendGA4Event({
  event_name: 'second_session',
  user_id: userId,
  params: {
    days_since_signup: daysSinceSignup,
    days_since_last_session: daysSinceLastSession,
  },
});
```

---

## 🔍 Testing Checklist

- [ ] User ID is set on login
- [ ] Signup events fire correctly
- [ ] First render events fire (idempotent)
- [ ] Credits events fire correctly
- [ ] Server-side events appear in GA4 (after 15 min delay)
- [ ] No duplicate events
- [ ] Events appear in GA4 Real-Time reports

---

## 📚 Next Steps

1. Complete Phase 1 integrations (render, credits, signup)
2. Create Measurement Protocol utility
3. Set up cron jobs for retention tracking
4. Test and validate all events
5. Mark conversions in GA4 UI
6. Set up funnels in GA4

---

**See:** `GA4_ENTERPRISE_IMPLEMENTATION_AUDIT.md` for full documentation

