# Ambassador/Affiliate Infrastructure - Roadmap & Architecture

**Date:** 2025-01-03  
**Status:** 🚧 In Planning

---

## 📋 Executive Summary

This document outlines the complete infrastructure for an ambassador/affiliate program where:
- **Anyone can apply** to become an ambassador
- **Verified ambassadors** get unique ambassador URLs
- **Commission Model**: 25% of user subscription revenue for 6 months
- **User Discount**: 20% (variable based on ambassador volume)
- **Payouts**: Weekly tracking and processing
- **Custom Links**: Ambassadors can create custom tracking links

---

## 🎯 Core Requirements

### 1. Application Flow
- Public route: `/ambassador` - Landing page with application form
- Dashboard route: `/dashboard/ambassador` - Ambassador dashboard
- Application states: `pending` → `approved` / `rejected` → `active`

### 2. Ambassador Features
- Unique ambassador code/URL (e.g., `/signup?ref=ABC123`)
- Custom link generation (e.g., `/signup?ref=ABC123&campaign=summer2025`)
- Real-time stats dashboard
- Commission tracking
- Payout history

### 3. Revenue Model
- **Commission**: 25% of subscription revenue for 6 months per referred user
- **User Discount**: 20% base discount (scales with ambassador volume)
- **Volume Tiers**: Discount % increases with more referrals
- **Payout Frequency**: Weekly (tracked, processed separately)

### 4. Tracking & Attribution
- Track signups via ambassador links
- Track subscription purchases from referred users
- Calculate commissions automatically
- Record weekly payout periods

---

## 🗄️ Database Schema Design

### Tables Required

#### 1. `ambassadors` Table
```sql
CREATE TABLE ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE, -- e.g., "ABC123"
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active', 'suspended'
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- Base discount %
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00, -- Commission %
  commission_duration_months INTEGER NOT NULL DEFAULT 6, -- Months to earn commission
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paid_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  application_data JSONB, -- Store application form data
  approved_by UUID REFERENCES users(id), -- Admin who approved
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  notes TEXT, -- Admin notes
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_code ON ambassadors(code);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
```

#### 2. `ambassador_links` Table
```sql
CREATE TABLE ambassador_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- Custom code (e.g., "summer2025")
  url TEXT NOT NULL, -- Full URL with ref parameter
  campaign_name TEXT, -- Optional campaign name
  description TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  signup_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0, -- Users who subscribed
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ambassador_id, code)
);

CREATE INDEX idx_ambassador_links_ambassador_id ON ambassador_links(ambassador_id);
CREATE INDEX idx_ambassador_links_code ON ambassador_links(code);
```

#### 3. `ambassador_referrals` Table
```sql
CREATE TABLE ambassador_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id UUID REFERENCES ambassador_links(id), -- Which link was used
  referral_code TEXT NOT NULL, -- The code used at signup
  signup_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_subscription_at TIMESTAMP, -- When they first subscribed
  subscription_id UUID REFERENCES user_subscriptions(id), -- Current active subscription
  total_commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_months_remaining INTEGER NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'expired'
  metadata JSONB, -- Additional tracking data
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ambassador_id, referred_user_id)
);

CREATE INDEX idx_ambassador_referrals_ambassador_id ON ambassador_referrals(ambassador_id);
CREATE INDEX idx_ambassador_referrals_referred_user_id ON ambassador_referrals(referred_user_id);
CREATE INDEX idx_ambassador_referrals_status ON ambassador_referrals(status);
```

#### 4. `ambassador_commissions` Table
```sql
CREATE TABLE ambassador_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES ambassador_referrals(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  payment_order_id UUID REFERENCES payment_orders(id), -- Link to payment
  period_start TIMESTAMP NOT NULL, -- Billing period start
  period_end TIMESTAMP NOT NULL, -- Billing period end
  subscription_amount DECIMAL(10,2) NOT NULL, -- Original subscription amount
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Discount given to user
  commission_percentage DECIMAL(5,2) NOT NULL, -- Commission % at time of payment
  commission_amount DECIMAL(10,2) NOT NULL, -- Calculated commission
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  payout_period_id UUID REFERENCES ambassador_payouts(id), -- Which payout period
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassador_commissions_ambassador_id ON ambassador_commissions(ambassador_id);
CREATE INDEX idx_ambassador_commissions_referral_id ON ambassador_commissions(referral_id);
CREATE INDEX idx_ambassador_commissions_status ON ambassador_commissions(status);
CREATE INDEX idx_ambassador_commissions_payout_period_id ON ambassador_commissions(payout_period_id);
```

#### 5. `ambassador_payouts` Table
```sql
CREATE TABLE ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL, -- Week start
  period_end TIMESTAMP NOT NULL, -- Week end
  total_commissions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_count INTEGER NOT NULL DEFAULT 0, -- Number of commissions in period
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
  payment_method TEXT, -- 'bank_transfer', 'paypal', 'stripe', etc.
  payment_reference TEXT, -- External payment reference
  paid_at TIMESTAMP,
  paid_by UUID REFERENCES users(id), -- Admin who processed
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassador_payouts_ambassador_id ON ambassador_payouts(ambassador_id);
CREATE INDEX idx_ambassador_payouts_status ON ambassador_payouts(status);
CREATE INDEX idx_ambassador_payouts_period ON ambassador_payouts(period_start, period_end);
```

#### 6. `ambassador_volume_tiers` Table (Optional - for dynamic discount)
```sql
CREATE TABLE ambassador_volume_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE, -- e.g., "Bronze", "Silver", "Gold"
  min_referrals INTEGER NOT NULL, -- Minimum referrals to reach tier
  discount_percentage DECIMAL(5,2) NOT NULL, -- Discount % for this tier
  commission_percentage DECIMAL(5,2) NOT NULL, -- Commission % for this tier (optional override)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🏗️ Architecture Layers

Following the existing pattern: **Components → Hooks → Actions → Services → DAL → Database**

### 1. Database Layer (`lib/db/schema.ts`)
- Add all ambassador-related table definitions
- Export Zod schemas for validation
- Export TypeScript types

### 2. DAL Layer (`lib/dal/ambassador.ts`)
- `AmbassadorDAL` class with methods:
  - `createApplication(userId, applicationData)`
  - `getAmbassadorByUserId(userId)`
  - `getAmbassadorByCode(code)`
  - `updateAmbassadorStatus(ambassadorId, status, adminId)`
  - `createCustomLink(ambassadorId, code, campaignName)`
  - `getAmbassadorLinks(ambassadorId)`
  - `trackReferral(ambassadorId, userId, referralCode, linkId)`
  - `getReferrals(ambassadorId)`
  - `recordCommission(ambassadorId, referralId, subscriptionId, amount, period)`
  - `getCommissions(ambassadorId, filters)`
  - `createPayoutPeriod(ambassadorId, periodStart, periodEnd)`
  - `getPayouts(ambassadorId)`
  - `updateVolumeTier(ambassadorId)` - Calculate and update discount based on volume

### 3. Services Layer (`lib/services/ambassador.service.ts`)
- `AmbassadorService` class with business logic:
  - `applyForAmbassador(userId, applicationData)` - Validate and create application
  - `generateAmbassadorCode()` - Generate unique code
  - `createCustomLink(ambassadorId, campaignName)` - Create tracking link
  - `trackSignup(referralCode, userId)` - Track user signup via referral
  - `applyDiscount(referralCode, amount)` - Calculate discount for user
  - `processSubscriptionPayment(subscriptionId, paymentOrderId)` - Calculate and record commission
  - `calculateCommission(subscriptionAmount, discountAmount, commissionPercentage)` - Commission calculation
  - `updateAmbassadorStats(ambassadorId)` - Update totals, earnings, etc.
  - `getWeeklyPayoutData(ambassadorId, weekStart, weekEnd)` - Aggregate commissions for payout
  - `calculateVolumeTier(referralCount)` - Determine tier based on volume

### 4. Actions Layer (`lib/actions/ambassador.actions.ts`)
- Server actions for client-side calls:
  - `applyForAmbassador(applicationData)`
  - `getAmbassadorStatus()`
  - `getAmbassadorDashboard()`
  - `createCustomLink(campaignName, description)`
  - `getAmbassadorStats()`
  - `getCommissionHistory(filters)`
  - `getPayoutHistory()`

### 5. Hooks Layer (`lib/hooks/use-ambassador.ts`)
- `useAmbassador()` - Get ambassador status and data
- `useAmbassadorStats()` - Get real-time stats
- `useAmbassadorLinks()` - Manage custom links
- `useCommissionHistory()` - Get commission history
- `usePayoutHistory()` - Get payout history

### 6. UI Components
- `components/ambassador/application-form.tsx` - Application form
- `components/ambassador/ambassador-dashboard.tsx` - Main dashboard
- `components/ambassador/stats-cards.tsx` - Stats display
- `components/ambassador/custom-links-manager.tsx` - Link management
- `components/ambassador/commission-history.tsx` - Commission table
- `components/ambassador/payout-history.tsx` - Payout table
- `components/ambassador/referral-list.tsx` - List of referrals

### 7. Pages
- `app/ambassador/page.tsx` - Public landing page with application
- `app/dashboard/ambassador/page.tsx` - Ambassador dashboard (protected)

### 8. API Routes
- `app/api/ambassador/apply/route.ts` - POST - Submit application
- `app/api/ambassador/links/route.ts` - GET/POST - Manage custom links
- `app/api/ambassador/stats/route.ts` - GET - Get ambassador stats
- `app/api/ambassador/commissions/route.ts` - GET - Get commission history
- `app/api/ambassador/payouts/route.ts` - GET - Get payout history
- `app/api/ambassador/track/route.ts` - POST - Track referral click/signup

---

## 🔄 Business Logic Flow

### Application Flow
1. User visits `/ambassador`
2. Fills application form
3. Submits → `AmbassadorService.applyForAmbassador()`
4. Status set to `pending`
5. Admin reviews and approves/rejects
6. If approved → Status → `active`, generate unique code
7. Ambassador can access dashboard

### Referral Flow
1. Ambassador shares link: `https://renderiq.com/signup?ref=ABC123`
2. User clicks link → Track click (optional)
3. User signs up → `AmbassadorService.trackSignup()`
4. Create `ambassador_referrals` record
5. When user subscribes → Apply discount (20% base, or tier-based)
6. Record commission → `AmbassadorService.processSubscriptionPayment()`
7. Create `ambassador_commissions` record
8. Update ambassador stats

### Commission Calculation
```
Subscription Amount: $100
Discount (20%): $20
Net Amount: $80
Commission (25% of $100): $25
```

**Note**: Commission is calculated on original amount, not discounted amount.

### Payout Flow
1. Weekly cron job aggregates commissions for previous week
2. Creates `ambassador_payouts` record with status `pending`
3. Admin reviews and processes payout
4. Update status to `paid` and record payment reference
5. Update `ambassador_commissions` records to link to payout

### Volume Tier System
- **Bronze** (0-9 referrals): 20% discount
- **Silver** (10-49 referrals): 25% discount
- **Gold** (50-99 referrals): 30% discount
- **Platinum** (100+ referrals): 35% discount

Tier is recalculated when:
- New referral signs up
- New referral subscribes
- Weekly stats update

---

## 🔐 Security Considerations

1. **Code Generation**: Use cryptographically secure random codes
2. **Referral Validation**: Verify referral codes on signup
3. **Commission Integrity**: Prevent duplicate commissions
4. **Admin Actions**: All status changes require admin authentication
5. **Rate Limiting**: Prevent abuse of link generation
6. **Fraud Detection**: Monitor for self-referrals, duplicate accounts

---

## 📊 Analytics & Reporting

### Ambassador Dashboard Metrics
- Total referrals
- Active subscribers
- Total earnings
- Pending earnings
- Paid earnings
- Conversion rate (signups → subscriptions)
- Click-through rate (if tracking clicks)
- Top performing links

### Admin Dashboard Metrics
- Total ambassadors
- Active ambassadors
- Total commissions paid
- Pending payouts
- Application queue
- Top performing ambassadors

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema and migrations
- [ ] DAL layer implementation
- [ ] Basic service layer
- [ ] Application form and submission
- [ ] Admin approval workflow

### Phase 2: Core Features (Week 2)
- [ ] Ambassador code generation
- [ ] Custom link creation
- [ ] Referral tracking on signup
- [ ] Discount application on subscription
- [ ] Commission calculation and recording

### Phase 3: Dashboard & UI (Week 3)
- [ ] Ambassador dashboard UI
- [ ] Stats display
- [ ] Custom links manager
- [ ] Commission history
- [ ] Referral list

### Phase 4: Payouts & Advanced (Week 4)
- [ ] Weekly payout aggregation
- [ ] Payout history
- [ ] Volume tier system
- [ ] Admin dashboard
- [ ] Analytics and reporting

### Phase 5: Testing & Polish (Week 5)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation
- [ ] Bug fixes

---

## 🔗 Integration Points

### Signup Flow Integration
- Modify `app/signup/page.tsx` to detect `?ref=` parameter
- Store referral code in session/cookie
- Call `AmbassadorService.trackSignup()` after user creation

### Subscription Flow Integration
- Modify subscription creation to check for referral code
- Apply discount before payment
- Call `AmbassadorService.processSubscriptionPayment()` after successful payment
- Update `paymentOrders` metadata with referral info

### Payment Webhook Integration
- Update Razorpay webhook handler to process ambassador commissions
- Trigger commission calculation on subscription.charged event

---

## 📝 Notes

1. **Commission Duration**: 6 months from first subscription payment
2. **Discount Application**: Applied at subscription creation, stored in `paymentOrders.discountAmount`
3. **Payout Processing**: Manual admin process initially, can be automated later
4. **Volume Tiers**: Can be configured via admin panel
5. **Code Format**: Alphanumeric, 6-8 characters, case-insensitive

---

## 🎯 Success Metrics

- Number of active ambassadors
- Total referrals generated
- Conversion rate (signups → paid subscriptions)
- Total commissions paid
- Average earnings per ambassador
- User acquisition cost reduction

---

## 📚 Related Documentation

- [Billing Infrastructure Audit](./BILLING_INFRASTRUCTURE_AUDIT.md)
- [Subscription System](./SUBSCRIPTION_DUPLICATE_PREVENTION_AUDIT.md)
- [Auth Infrastructure](./AUTH_INFRASTRUCTURE.md)

