# Analytics Implementation

**Date:** 2025-01-27  
**Status:** ✅ Complete

## Overview

Complete analytics infrastructure for tracking user usage, API calls, credits, and render statistics with rich data visualization.

## Architecture

### 1. Data Layer (`lib/dal/usage-tracking.ts`)
- **UsageTrackingDAL**: Database operations for usage tracking
- **Features**:
  - Daily usage aggregation (upsert pattern)
  - Date range queries
  - Aggregated statistics

### 2. Service Layer (`lib/services/analytics-service.ts`)
- **AnalyticsService**: Business logic for analytics
- **Features**:
  - Render statistics (by type, status, quality, platform)
  - Credit statistics (spent, earned, by type)
  - API usage statistics (by platform, routes)
  - User activity statistics (logins, signups)
  - Daily usage data for charts
  - Automatic usage tracking on render creation

### 3. Server Actions (`lib/actions/analytics.actions.ts`)
- **getAnalyticsData**: Comprehensive analytics data
- **getRenderStats**: Render statistics only
- **getCreditStats**: Credit statistics only
- **getApiUsageStats**: API usage statistics only

### 4. React Hooks (`lib/hooks/use-analytics.ts`)
- **useAnalytics**: Main hook with auto-fetch and refetch interval
- **useRenderStats**: Render statistics hook
- **useCreditStats**: Credit statistics hook
- **useApiUsageStats**: API usage statistics hook

### 5. UI Components
- **`app/dashboard/analytics/page.tsx`**: Main analytics page
- **`components/analytics/stats-cards.tsx`**: Summary stat cards
- **`components/analytics/daily-usage-chart.tsx`**: Daily usage line chart
- **`components/analytics/render-stats-chart.tsx`**: Render statistics charts (pie, bar)
- **`components/analytics/credit-usage-chart.tsx`**: Credit usage charts
- **`components/analytics/api-usage-chart.tsx`**: API usage charts

## Data Sources

### Telemetry Data Collected

1. **Renders Table**:
   - Type (image/video)
   - Status (pending/processing/completed/failed)
   - Quality (standard/high/ultra)
   - Platform (render/tools/canvas)
   - Metadata (sourcePlatform, pluginVersion, userAgent)
   - Credits cost
   - Processing time

2. **Credit Transactions Table**:
   - Type (debit/credit)
   - Amount
   - Reference type (render/refund/purchase/subscription/bonus)

3. **Account Activity Table**:
   - Event type (signup/login/render/credit_purchase/logout)
   - IP address
   - User agent
   - Timestamps

4. **Plugin API Keys Table**:
   - Active status
   - Last used timestamp
   - Key count

5. **Usage Tracking Table** (newly populated):
   - Daily aggregates
   - Renders created
   - Credits spent
   - API calls
   - Storage used

## Integration Points

### Render Creation
- **Location**: `app/api/renders/route.ts`
- **Integration**: After render record creation, calls `AnalyticsService.recordRenderCreation()`
- **Non-blocking**: Usage tracking failures don't break render creation

### Dashboard Navigation
- **Location**: `app/dashboard/layout.tsx`
- **Status**: ✅ Already integrated (line 207)

## Charts & Visualizations

### Overview Tab
- **Daily Usage Chart**: Line chart showing renders, credits, and API calls over time

### Renders Tab
- **By Type**: Pie chart (Image vs Video)
- **By Status**: Bar chart (Completed, Failed, Pending, Processing)
- **By Quality**: Bar chart (Standard, High, Ultra)
- **By Platform**: Bar chart (Web App, Tools, Canvas, Plugins)
- **Performance Metrics**: Average processing time and success rate

### Credits Tab
- **Credit Breakdown**: Bar chart by category
- **Summary Cards**: Total spent, earned, net balance, average per day
- **Daily Credit Usage**: Line chart

### API Usage Tab
- **Summary Cards**: Total calls, active keys, average per day
- **Usage by Platform**: Bar chart (if plugin usage exists)

## Features

✅ **Real-time Data**: Fetches latest data on page load  
✅ **Auto-refresh**: Optional refetch interval support  
✅ **Error Handling**: Graceful error states with retry  
✅ **Loading States**: Skeleton loaders  
✅ **Responsive Design**: Mobile-friendly charts  
✅ **Type Safety**: Full TypeScript support  
✅ **Performance**: Parallel data fetching, optimized queries

## Usage Tracking Status

### ✅ Currently Tracked
- Render creation (via `AnalyticsService.recordRenderCreation()`)
- Credits spent (from render creation)
- API calls (detected via metadata.sourcePlatform)

### ⚠️ Not Yet Tracked (Future Enhancements)
- Storage usage (needs file size tracking)
- API route-level tracking (needs middleware)
- Real-time API call tracking (currently inferred from renders)

## Future Enhancements

1. **Real-time API Tracking**: Middleware to track all API routes
2. **Storage Tracking**: Track file uploads and storage usage
3. **Export Functionality**: CSV/JSON export of analytics data
4. **Custom Date Ranges**: User-selectable time ranges
5. **Comparison Views**: Compare periods (this month vs last month)
6. **Alerts**: Notifications for usage thresholds
7. **Cost Analysis**: Estimated costs based on usage

## Dependencies

- **recharts**: ^2.15.4 (charting library)
- **date-fns**: ^4.1.0 (date formatting)
- **lucide-react**: Icons

## Testing Checklist

- [ ] Analytics page loads without errors
- [ ] Charts render correctly with data
- [ ] Empty states display properly
- [ ] Error states show retry option
- [ ] Usage tracking records on render creation
- [ ] Date range queries work correctly
- [ ] Mobile responsive design works

## Notes

- Usage tracking is **non-blocking** - failures don't break render creation
- Analytics data is aggregated from existing tables (renders, credit_transactions, etc.)
- The `usage_tracking` table is now being populated automatically
- All analytics are user-scoped (only shows current user's data)

