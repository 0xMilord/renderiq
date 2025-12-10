// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// NOTE: Main client configuration is in sentry.client.config.ts
// This file is for additional client-side instrumentation if needed

import * as Sentry from "@sentry/nextjs";

// Distributed Tracing: Configure which URLs should have trace propagation headers
// This enables distributed tracing across your frontend and backend
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856",
  
  integrations: [Sentry.browserTracingIntegration()],
  
  // Distributed Tracing: Configure trace propagation targets
  // This allows tracing requests from frontend to backend APIs
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/renderiq\.io\/api/,
    /^https:\/\/.*\.renderiq\.io\/api/,
    /^https:\/\/.*\.vercel\.app\/api/,
    // Include any other API domains you use
    process.env.NEXT_PUBLIC_BASE_URL ? new RegExp(`^${process.env.NEXT_PUBLIC_BASE_URL}/api`) : undefined,
  ].filter(Boolean) as (string | RegExp)[],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;