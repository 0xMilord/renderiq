# GA4 Dashboard Setup Guide

**Date:** 2025-01-27  
**Status:** ✅ Ready for Implementation  
**Priority:** 🔴 Critical (Fundraising Preparation)

This guide provides step-by-step instructions for configuring your GA4 dashboard to properly track and analyze all events implemented in the codebase.

---

## Prerequisites

1. **GA4 Property Access**
   - Admin access to GA4 property `G-Z8NSF00GYD`
   - Access to Google Tag Manager `GTM-T7XGR57L` (optional)

2. **Measurement Protocol API Secret**
   - Required for server-side tracking (cron jobs)
   - Create in: GA4 Admin → Data Streams → [Your Stream] → Measurement Protocol API secrets

---

## Step 1: Configure User Identification ✅

### 1.1 Enable User ID Collection

**Location:** GA4 Admin → Data Settings → User Data Collection

**Actions:**
1. Enable "User ID collection"
2. Enable "Google signals data collection" (optional, for demographics)
3. Enable "Enhanced measurement" (page views, scrolls, outbound clicks)

**Status:** ✅ Already configured in `app/layout.tsx` with `anonymize_ip: true`

---

## Step 2: Mark Conversion Events ✅

**Location:** GA4 Admin → Events → [Event Name] → Mark as conversion

**Mark these 7 events as conversions:**

1. ✅ **`signup_completed`**
   - Click "Mark as conversion" toggle
   - This is your primary acquisition metric

2. ✅ **`first_render_completed`**
   - Click "Mark as conversion" toggle
   - This is your primary activation metric

3. ✅ **`render_activated`**
   - Click "Mark as conversion" toggle
   - This is your true activation metric (first render + refine/export)

4. ✅ **`second_session`**
   - Click "Mark as conversion" toggle
   - This is your primary retention metric

5. ✅ **`weekly_active`**
   - Click "Mark as conversion" toggle
   - This is your engagement metric

6. ✅ **`credits_spent`**
   - Click "Mark as conversion" toggle
   - This is your value metric

7. ✅ **`upgrade_clicked`**
   - Click "Mark as conversion" toggle
   - This is your monetization intent metric

**⚠️ Important:** Do NOT mark more than these 7. VCs want clean conversion dashboards.

---

## Step 3: Create Custom Dimensions

**Location:** GA4 Admin → Custom Definitions → Custom Dimensions → Create custom dimension

### 3.1 Event-Scoped Dimensions

Create these event-scoped dimensions (50 max):

| Dimension Name | Scope | Description | Example Values |
|----------------|-------|-------------|----------------|
| `render_id` | Event | Render identifier | UUID |
| `project_id` | Event | Project identifier | UUID |
| `render_type` | Event | Type of render | `image`, `video` |
| `render_platform` | Event | Platform used | `render`, `tools`, `canvas`, `plugin` |
| `render_quality` | Event | Quality setting | `standard`, `high`, `ultra` |
| `render_style` | Event | Style used | `architectural`, `modern`, etc. |
| `tool_id` | Event | Tool identifier | UUID |
| `tool_name` | Event | Tool name | `render-to-section-drawing` |
| `tool_category` | Event | Tool category | `generation`, `refine`, `convert` |
| `credits_cost` | Event | Credits spent | `1`, `5`, `10` |
| `payment_method` | Event | Payment method | `card`, `upi`, `wallet` |
| `package_type` | Event | Package type | `credit_package`, `subscription` |

**Steps:**
1. Go to Custom Definitions → Custom Dimensions
2. Click "Create custom dimension"
3. Enter dimension name (e.g., `render_id`)
4. Select scope: **Event**
5. Event parameter: `render_id` (must match parameter name in code)
6. Click "Save"
7. Repeat for all dimensions above

### 3.2 User-Scoped Dimensions

Create these user-scoped dimensions (25 max):

| Dimension Name | Scope | Description | Example Values |
|----------------|-------|-------------|----------------|
| `user_role` | User | User role | `free`, `paid`, `admin` |
| `signup_source` | User | Signup source | `direct`, `referral`, `chatgpt`, `google` |
| `signup_date` | User | Signup date | ISO date string |
| `subscription_status` | User | Subscription status | `none`, `active`, `cancelled` |
| `subscription_plan` | User | Subscription plan name | `Pro`, `Enterprise`, `null` |

**Steps:**
1. Go to Custom Definitions → Custom Dimensions
2. Click "Create custom dimension"
3. Enter dimension name (e.g., `user_role`)
4. Select scope: **User**
5. User property: `user_role` (must match property name in code)
6. Click "Save"
7. Repeat for all dimensions above

---

## Step 4: Create Funnels

**Location:** GA4 → Explore → Funnel exploration

### Funnel 1: Activation Funnel

**Name:** "User Activation"

**Steps:**
1. Click "Create funnel exploration"
2. Add steps:
   - Step 1: `page_view` (any page)
   - Step 2: `signup_completed`
   - Step 3: `first_render_completed`
   - Step 4: `render_activated`
3. Set breakdown dimension: `signup_source`
4. Save as "Activation Funnel"

**What to Monitor:**
- Drop-off between signup → first render
- Drop-off between first render → activation
- Conversion rate by signup source

---

### Funnel 2: Habit Formation Funnel

**Name:** "User Retention"

**Steps:**
1. Click "Create funnel exploration"
2. Add steps:
   - Step 1: `signup_completed`
   - Step 2: `first_login` (or `page_view` with user_id)
   - Step 3: `second_session`
   - Step 4: `weekly_active`
3. Set breakdown dimension: `user_role`
4. Save as "Retention Funnel"

**What to Monitor:**
- % of users who return (second_session rate)
- % of users who become weekly active
- Retention by user role

---

### Funnel 3: Value Funnel

**Name:** "Monetization Intent"

**Steps:**
1. Click "Create funnel exploration"
2. Add steps:
   - Step 1: `render_completed` (any render)
   - Step 2: `credits_spent`
   - Step 3: `upgrade_clicked`
   - Step 4: `payment_completed` (when implemented)
3. Set breakdown dimension: `render_platform`
4. Save as "Value Funnel"

**What to Monitor:**
- % of users who spend credits
- % of users who click upgrade
- Conversion from render → payment

---

### Funnel 4: Tool Discovery Funnel

**Name:** "Tool Adoption"

**Steps:**
1. Click "Create funnel exploration"
2. Add steps:
   - Step 1: `first_render_completed`
   - Step 2: `tool_used` (any tool)
   - Step 3: `tool_used` (different tool)
3. Set breakdown dimension: `tool_category`
4. Save as "Tool Discovery Funnel"

**What to Monitor:**
- % of users who try tools after first render
- % of users who try multiple tools
- Which tool categories drive retention

---

## Step 5: Create Custom Reports

**Location:** GA4 → Explore → Create new exploration

### Report 1: Activation Metrics Dashboard

**Type:** Free form

**Metrics:**
- `signup_completed` (count)
- `first_render_completed` (count)
- `render_activated` (count)
- Activation rate: `render_activated / signup_completed * 100`

**Dimensions:**
- `signup_source`
- `user_role`
- Date

**Save as:** "Activation Metrics"

---

### Report 2: Retention Cohort Analysis

**Type:** Cohort exploration

**Settings:**
- Cohort type: **User-based**
- Acquisition: `signup_completed`
- Return criteria: `second_session` OR `weekly_active`
- Cohort size: **Week**

**Metrics to Add:**
- `second_session` rate
- `weekly_active` rate
- `renders_per_user` (from DB, not GA4)

**Save as:** "Retention Cohorts"

---

### Report 3: Revenue Attribution

**Type:** Free form

**Metrics:**
- `credits_spent` (count, sum of `credits_cost`)
- `payment_completed` (count)
- `upgrade_clicked` (count)

**Dimensions:**
- `signup_source`
- `user_role`
- `package_type`
- Date

**Save as:** "Revenue Attribution"

---

### Report 4: Tool Performance

**Type:** Free form

**Metrics:**
- `tool_used` (count)
- `tool_completed` (count)
- `tool_failed` (count)
- Success rate: `tool_completed / tool_used * 100`

**Dimensions:**
- `tool_name`
- `tool_category`
- `input_type`
- Date

**Save as:** "Tool Performance"

---

## Step 6: Set Up Measurement Protocol

**Location:** GA4 Admin → Data Streams → [Your Stream] → Measurement Protocol API secrets

**Steps:**
1. Click "Create"
2. Enter nickname: "Renderiq Server-Side Tracking"
3. Click "Create"
4. **Copy the API secret** (only shown once!)
5. Add to environment variables:
   ```
   GA4_API_SECRET=your_secret_here
   ```

**⚠️ Important:**
- Store securely (never commit to repo)
- Use for cron jobs only
- Events appear with 5-15 minute delay

---

## Step 7: Configure Data Retention

**Location:** GA4 Admin → Data Settings → Data Retention

**Settings:**
- Retention period: **14 months** (default)
- Reset on new activity: **Enabled**

**Why:**
- 14 months is standard for SaaS
- Reset on activity keeps active users' data longer
- Complies with GDPR (users can request deletion)

---

## Step 8: Set Up Annotations

**Location:** GA4 Reports → Any report → Click date range → "Create annotation"

**Create annotations for:**
- Product launches
- Feature releases
- Marketing campaigns
- Pricing changes
- Major bug fixes

**Why:**
- Helps explain data spikes/drops
- VCs will ask "what happened here?"
- Annotations provide context

---

## Step 9: Create Alerts

**Location:** GA4 Admin → Custom Alerts → Create alert

### Alert 1: Activation Rate Drop

**Conditions:**
- `render_activated` conversion rate drops below 25%
- Compare to previous 7 days
- Alert frequency: Daily

### Alert 2: Retention Rate Drop

**Conditions:**
- `second_session` conversion rate drops below 30%
- Compare to previous 7 days
- Alert frequency: Daily

### Alert 3: Payment Issues

**Conditions:**
- `payment_failed` count increases by 50%
- Compare to previous 7 days
- Alert frequency: Daily

---

## Step 10: Set Up Real-Time Monitoring

**Location:** GA4 → Reports → Real-time

**What to Monitor:**
- Active users
- Top events (should see `render_created`, `credits_spent`, etc.)
- Top pages
- Conversions (should see your 7 conversion events)

**Use for:**
- Testing new events
- Debugging tracking issues
- Monitoring live user activity

---

## Step 11: Configure Data Filters

**Location:** GA4 Admin → Data Settings → Data Filters

### Filter 1: Internal Traffic

**Purpose:** Exclude your team's activity

**Steps:**
1. Click "Create filter"
2. Filter name: "Internal Traffic"
3. Filter type: **Internal traffic**
4. IP addresses: Add your office IPs
5. Click "Save"

### Filter 2: Bot Traffic (Optional)

**Purpose:** Exclude known bots

**Steps:**
1. Click "Create filter"
2. Filter name: "Bot Traffic"
3. Filter type: **Bot traffic**
4. Click "Save"

**⚠️ Note:** GA4 automatically filters most bots, but you can add custom filters if needed.

---

## Step 12: Set Up Attribution Models

**Location:** GA4 Admin → Attribution Settings

**Recommended Settings:**
- Attribution model: **Data-driven** (default)
- Lookback window: **30 days** (acquisition), **90 days** (other events)

**Why:**
- Data-driven model uses ML to assign credit
- 30-day lookback captures full user journey
- VCs will ask about attribution

---

## Step 13: Create Custom Audiences

**Location:** GA4 Admin → Audiences → New audience

### Audience 1: Activated Users

**Definition:**
- Users who triggered `render_activated` in last 30 days

**Use for:**
- Retargeting campaigns
- Product updates
- Feature announcements

### Audience 2: At-Risk Users

**Definition:**
- Users who signed up but haven't triggered `second_session` in 7 days

**Use for:**
- Re-engagement campaigns
- Onboarding improvements

### Audience 3: Power Users

**Definition:**
- Users who triggered `weekly_active` in last 30 days
- AND `credits_spent` > 50

**Use for:**
- Beta features
- Customer interviews
- Case studies

---

## Step 14: Set Up Data Exports (Optional)

**Location:** GA4 Admin → Data Export → BigQuery Export

**Purpose:**
- Export raw event data to BigQuery
- Advanced analysis beyond GA4 UI
- Custom SQL queries
- Data warehouse integration

**Steps:**
1. Enable BigQuery export
2. Select BigQuery project
3. Choose daily or streaming export
4. Wait 24-48 hours for first export

**⚠️ Note:** BigQuery export has costs. Only enable if you need advanced analysis.

---

## Step 15: Test Everything

### Testing Checklist

- [ ] User ID is set on login (check Real-time → User snapshot)
- [ ] User properties are set (check Real-time → User properties)
- [ ] All 7 conversion events fire (check Real-time → Conversions)
- [ ] Custom dimensions appear in reports
- [ ] Funnels show data
- [ ] Server-side events appear (wait 15+ minutes, check Events report)
- [ ] No duplicate events
- [ ] Events have correct parameters

### Testing Tools

1. **GA4 DebugView**
   - Chrome extension: "Google Analytics Debugger"
   - Or use: `chrome://inspect` → Network tab
   - See events in real-time with all parameters

2. **GA4 Real-Time Reports**
   - Location: GA4 → Reports → Real-time
   - Verify events fire immediately

3. **Browser Console**
   - Check for `gtag` calls
   - Verify `window.dataLayer` has events

---

## Step 16: Create Investor-Ready Dashboard

**Location:** GA4 → Explore → Create new exploration → Dashboard

### Dashboard: "Fundraising Metrics"

**Sections:**

#### Section 1: Acquisition
- `signup_completed` (count, trend)
- Signup rate by source
- Cost per signup (if you have ad spend data)

#### Section 2: Activation
- `render_activated` conversion rate
- Time to first render (from DB)
- Activation rate by source

#### Section 3: Retention
- `second_session` conversion rate
- `weekly_active` conversion rate
- Retention cohort chart

#### Section 4: Engagement
- Renders per user per week (from DB)
- Tools used per user
- Session quality metrics

#### Section 5: Value
- `credits_spent` per active user
- `upgrade_clicked` rate
- Payment conversion rate

**Save as:** "Fundraising Dashboard"

**Share with:**
- Investors
- Board members
- Key stakeholders

---

## Step 17: Schedule Reports (Optional)

**Location:** GA4 → Reports → [Any Report] → Share → Schedule email

**Recommended Reports to Schedule:**

1. **Weekly Activation Report**
   - Frequency: Weekly (Monday)
   - Recipients: Founders, Product team
   - Includes: Activation funnel, retention metrics

2. **Monthly Investor Report**
   - Frequency: Monthly (1st of month)
   - Recipients: Investors, Board
   - Includes: All key metrics, trends, insights

---

## Step 18: Set Up Goals (Optional)

**Location:** GA4 Admin → Goals (if available in your GA4 version)

**Note:** GA4 doesn't have traditional "Goals" like Universal Analytics. Use Conversions instead (already set up in Step 2).

---

## Environment Variables Required

Add these to your `.env` file:

```bash
# GA4 Configuration
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-Z8NSF00GYD
GA4_API_SECRET=your_measurement_protocol_secret_here

# Cron Jobs (for server-side tracking)
CRON_SECRET=your_secure_random_string_here
```

**⚠️ Security:**
- Never commit `.env` files
- Rotate `CRON_SECRET` regularly
- Store `GA4_API_SECRET` securely (use secrets manager in production)

---

## Cron Job Setup

### Set Up Cron Scheduler

**Option 1: Vercel Cron (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/analytics/second-session",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/analytics/weekly-active",
      "schedule": "0 3 * * 1"
    }
  ]
}
```

**Option 2: External Cron Service**

Use services like:
- cron-job.org
- EasyCron
- GitHub Actions (scheduled workflows)

**Schedule:**
- Second Session: Daily at 2 AM UTC
- Weekly Active: Weekly on Monday at 3 AM UTC

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

---

## Troubleshooting

### Events Not Appearing

1. **Check Real-Time Reports**
   - Events should appear within seconds
   - If not, check browser console for errors

2. **Check DebugView**
   - Install Google Analytics Debugger extension
   - Verify events are firing

3. **Check Measurement Protocol**
   - Server-side events take 5-15 minutes
   - Check Events report (not Real-time)

### Duplicate Events

1. **Check for multiple `gtag` initializations**
   - Should only initialize once in `app/layout.tsx`

2. **Check for event firing in multiple places**
   - Review integration points
   - Ensure events fire once per action

### Missing User Properties

1. **Check user is logged in**
   - User properties only set on login
   - Verify `initGA4User()` is called

2. **Check property names**
   - Must match exactly (case-sensitive)
   - Check custom dimension configuration

---

## Key Metrics to Monitor Weekly

### Primary Metrics (VC Questions)

1. **Activation Rate**
   - Formula: `render_activated / signup_completed * 100`
   - Target: >30%
   - Location: Conversion report

2. **Time to First Render**
   - Formula: Average time from signup to first render
   - Target: <5 minutes
   - Location: Custom report (combine GA4 + DB data)

3. **Second Session Rate**
   - Formula: `second_session / signup_completed * 100`
   - Target: >40%
   - Location: Conversion report

4. **Weekly Active Rate**
   - Formula: `weekly_active / total_users * 100`
   - Target: >20%
   - Location: Conversion report

5. **Credit Spend Rate**
   - Formula: Users who spent credits / total users * 100
   - Target: >50%
   - Location: Custom report

### Secondary Metrics

- Renders per user per week (DB)
- Tools used per user (GA4 + DB)
- Average credits spent per user (DB)
- Payment conversion rate (GA4 + DB)

---

## Next Steps After Setup

1. ✅ **Wait 24-48 hours** for data to accumulate
2. ✅ **Verify all events** are firing correctly
3. ✅ **Check custom dimensions** appear in reports
4. ✅ **Test funnels** with real user data
5. ✅ **Create investor dashboard** with actual metrics
6. ✅ **Set up weekly review** process
7. ✅ **Document baseline metrics** for comparison

---

## Support & Resources

- **GA4 Help Center:** https://support.google.com/analytics/answer/9304153
- **Measurement Protocol Docs:** https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **GA4 Community:** https://support.google.com/analytics/community

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Status:** ✅ Ready for Implementation

