# Sentry Release Health Configuration

This document describes the Release Health monitoring setup for tracking session health, crash rates, and release adoption.

## Overview

Release Health automatically tracks:
- **Sessions**: User interactions with the application
- **Crashes**: Unhandled errors that crash the application
- **Crash-free rate**: Percentage of sessions/users without crashes
- **Release adoption**: How many users are on each release
- **Session status**: Healthy, Errored, Crashed, or Abnormal

## How It Works

### Client-Side (User-Mode Sessions)

For Next.js applications, Sentry automatically creates sessions:

1. **Session Start**: When a user loads a page
2. **Session Continuation**: On client-side navigation (SPA routing)
3. **Session End**: When the app is closed or sent to background

**Configuration:**
- Sessions are automatically tracked (`autoSessionTracking: true`)
- Background sessions are not tracked by default
- Each page load/navigation creates a new session

### Server-Side (Request-Mode Sessions)

For server-side code:

1. **Session Start**: When server receives an HTTP request
2. **Session End**: When server sends a response

**Configuration:**
- Each API request is tracked as a session
- High volume but provides detailed server health metrics
- Automatically enabled for server-side code

## Release Tracking

### Automatic Release Naming

Releases are automatically named during build:

```
renderiq@{version}-{buildId}
```

**Components:**
- `{version}`: From `package.json` version field
- `{buildId}`: Git commit SHA (first 7 chars) on Vercel, or build date

**Examples:**
- `renderiq@0.1.0-abc1234` (Vercel deployment with Git SHA)
- `renderiq@0.1.0-2025-01-27` (Local build with date)

### Manual Release Override

You can override the automatic release naming:

```bash
# In your environment variables
NEXT_PUBLIC_SENTRY_RELEASE=renderiq@1.0.0-custom-release
```

### Release Configuration

The release is automatically set in `next.config.ts`:

```typescript
env: {
  NEXT_PUBLIC_SENTRY_RELEASE: `renderiq@${version}-${buildId}`,
}
```

## Viewing Release Health Data

### In Sentry Dashboard

1. **Releases Page**
   - Go to **Releases** in Sentry
   - View all releases with health metrics
   - Sort by active sessions, crash-free rate, etc.

2. **Release Details**
   - Click on a specific release
   - View detailed metrics:
     - Session breakdown by status
     - Crash-free rate over time
     - Adoption percentage
     - Associated issues

3. **Discover**
   - Filter by release: `release:renderiq@0.1.0-abc1234`
   - Analyze errors by release
   - Compare releases

### Key Metrics

1. **Active Sessions/Users**
   - Sessions/users in the last 24 hours
   - Shows current usage of each release

2. **Crash-Free Rate**
   - Percentage of sessions without crashes
   - Critical health metric
   - Target: >99%

3. **Crashed Users**
   - Number of users who experienced crashes
   - Helps assess impact

4. **Adoption**
   - Percentage of sessions/users on this release
   - Shows release rollout progress

5. **Session Status**
   - **Healthy**: No errors
   - **Errored**: Handled errors occurred
   - **Crashed**: Unhandled error/crash
   - **Abnormal**: Timeout or force quit

## Setting Up Alerts

### Crash Rate Alerts

1. Go to **Alerts** → **Create Alert**
2. Select **Sessions Crash Rate Alert**
3. Configure:
   ```
   Alert when: Crash-free rate < 99%
   Time window: Last 1 hour
   Releases: All releases (or specific release)
   ```
4. Set notification channels (email, Slack, etc.)

### Release Adoption Alerts

1. Create a custom alert
2. Monitor adoption percentage
3. Alert when adoption is low for new releases

## Best Practices

### 1. Monitor Crash-Free Rate

- **Target**: >99% crash-free sessions
- **Action**: Investigate any release with <99% crash-free rate
- **Alert**: Set up alerts for crash rate spikes

### 2. Track Release Adoption

- Monitor how quickly users adopt new releases
- Identify if users are stuck on old versions
- Use adoption data to plan rollouts

### 3. Compare Releases

- Compare crash-free rates between releases
- Identify if new releases introduce regressions
- Use data to make rollback decisions

### 4. Link Issues to Releases

- When investigating issues, check release health
- See which releases are affected
- Track if fixes improve release health

### 5. Regular Review

- Review release health weekly
- Identify trends and patterns
- Use data to improve release process

## Troubleshooting

### Sessions Not Appearing

1. **Check Release Name**
   - Verify release is set correctly
   - Check `NEXT_PUBLIC_SENTRY_RELEASE` env var
   - Ensure release matches in Sentry dashboard

2. **Check DSN**
   - Verify `NEXT_PUBLIC_SENTRY_DSN` is set
   - Ensure DSN is correct for your project

3. **Check Environment**
   - Sessions only tracked in production by default
   - Set `SENTRY_DEBUG=true` to enable in development

### Crash-Free Rate Not Accurate

1. **Check Error Handling**
   - Ensure errors are properly caught
   - Unhandled errors count as crashes
   - Handled errors count as "errored" sessions

2. **Check Filters**
   - Verify error filters aren't hiding crashes
   - Check `ignoreErrors` in Sentry config

3. **Check Sample Rates**
   - Ensure sessions aren't being sampled out
   - Sessions are not subject to sampling (always tracked)

### Release Not Showing

1. **Check Build Process**
   - Verify release is set during build
   - Check `next.config.ts` configuration
   - Ensure env vars are available during build

2. **Check Sentry Project**
   - Verify you're looking at the correct project
   - Check release appears in Sentry dashboard
   - Wait a few minutes for data to appear

## Configuration Reference

### Client Configuration

```typescript
// sentry.client.config.ts
Sentry.init({
  // Release Health is automatically enabled
  autoSessionTracking: true,
  
  // Session tracking options
  sessionTracking: {
    trackBackgroundSessions: false, // Don't track when app is in background
  },
  
  // Release identifier
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});
```

### Server Configuration

```typescript
// sentry.server.config.ts
Sentry.init({
  // Release Health is automatically enabled
  autoSessionTracking: true,
  
  // Release identifier
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});
```

## Additional Resources

- [Sentry Release Health Documentation](https://docs.sentry.io/product/releases/health/)
- [Sentry Sessions Documentation](https://docs.sentry.io/product/releases/health/#sessions)
- [Sentry Release Health Setup](https://docs.sentry.io/product/releases/setup/#release-health)

