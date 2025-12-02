# Console.log Migration to Logger Utility

## Overview
All console.log, console.error, console.warn statements need to be replaced with the logger utility to ensure they only show in development, not production.

## Files Already Using Logger ✅
- `lib/utils/logger.ts` - The logger utility itself
- `lib/services/ai-sdk-service.ts` - Already uses logger
- `lib/services/render.ts` - Already uses logger  
- `lib/actions/render.actions.ts` - Already uses logger
- `app/api/renders/route.ts` - Already uses logger
- `app/api/ai/completion/route.ts` - Already uses logger
- `app/api/ai/generate-image/route.ts` - Already uses logger
- `app/api/ai/chat/route.ts` - Already uses logger

## Files Needing Migration 🔄

### Critical Server-Side Files (Priority 1)
1. ✅ `lib/services/auth.ts` - IN PROGRESS
2. `lib/actions/projects.actions.ts` - Has console.log statements
3. `app/api/video/route.ts` - Has console.log statements
4. `lib/services/ai-sdk-service.ts` - Check for any remaining
5. `lib/services/version-context.ts` - Has many console.log
6. `lib/services/context-prompt.ts` - Has console.log
7. `lib/services/watermark.ts` - Has console.log
8. `lib/utils/auth-redirect.ts` - Has console.log/warn

### API Routes (Priority 2)
1. `app/api/ai/generate-video/route.ts`
2. `app/api/ai/enhance-prompt/route.ts`
3. `app/api/canvas/generate-variants/route.ts`
4. `app/api/canvas/[chainId]/graph/route.ts`
5. `app/api/qr-signup/route.ts`
6. `app/auth/callback/route.ts`

### Server Actions (Priority 3)
1. `lib/actions/projects.actions.ts` - Already listed above

### Client Components (Priority 4 - Lower priority but should be done)
- All files in `components/` directory
- All files in `app/*/page.tsx` that are client components
- Hook files in `lib/hooks/`

## Migration Steps

For each file:
1. Add import: `import { logger } from '@/lib/utils/logger';`
2. Replace `console.log` → `logger.log`
3. Replace `console.error` → `logger.error`
4. Replace `console.warn` → `logger.warn`
5. Replace `console.info` → `logger.info`
6. Replace `console.debug` → `logger.debug`

## Current Status

**Updated**: 
- ✅ `lib/services/auth.ts` - All console statements replaced

**In Progress**: 
- 🔄 Starting batch replacement for other critical files

**Remaining**: 
- ~450+ console.log statements across codebase

## Notes

- Errors will still log in production (by design)
- All other log levels only show in development
- Logger utility already handles NODE_ENV check

