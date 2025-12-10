# UI Integration Audit - Platform Separation

**Date**: 2025-01-27  
**Status**: 🔄 In Progress

---

## Summary

Audit of UI integration across `/render`, `/canvas`, and `/apps` platforms to ensure proper use of new infrastructure.

---

## ✅ Completed Integrations

### 1. Tools Platform (`/apps`)
- ✅ **`components/tools/base-tool-component.tsx`** - Uses `useToolRenders` hook (fetches from `tool_executions`)
- ✅ **`lib/hooks/use-tool-renders.ts`** - Updated to fetch from `tool_executions` instead of filtering renders
- ✅ **`app/apps/[toolSlug]/tool-client.tsx`** - Uses `ToolOrchestrator` and `ToolLayout`
- ✅ **`components/tools/tool-layout.tsx`** - Creates projects with `isToolsProject` metadata

### 2. Render Platform (`/render`)
- ✅ **`app/render/chat-client.tsx`** - Uses render chains (correct for render platform)
- ✅ **`lib/actions/render.actions.ts`** - Sets `platform='render'` for render platform

### 3. Canvas Platform (`/canvas`)
- ✅ **`app/canvas/[projectSlug]/[chatId]/page.tsx`** - Uses legacy `chainId` (backward compatible)
- ✅ **`lib/dal/canvas.ts`** - Supports both `chainId` (legacy) and `fileId` (new)
- ✅ **`lib/actions/canvas-files.actions.ts`** - File-based actions available

---

## ❌ Missing Integrations

### 1. Dashboard Projects Page (`app/dashboard/projects/page.tsx`)

#### Issues:
- ❌ **No platform filtering** - Projects not categorized by platform (render/tools/canvas)
- ❌ **No tool category filtering** - Projects not categorized by tool category
- ❌ **No platform badges** - Projects don't show which platform they belong to
- ❌ **No tool usage display** - Projects don't show which tools were used

#### Required Changes:
1. Add `getByUserIdWithPlatformInfo` method to ProjectsDAL ✅ (DONE)
2. Update projects hook to fetch platform info
3. Add filter UI for:
   - Platform (All / Render / Tools / Canvas)
   - Tool Category (All / Transformation / Floorplan / Diagram / etc.)
4. Add platform badges to project cards
5. Show tool categories used in each project

### 2. Project Card Component (`components/projects/project-card.tsx`)

#### Issues:
- ❌ **No platform indicator** - Doesn't show which platform the project uses
- ❌ **No tool category badges** - Doesn't show tool categories

#### Required Changes:
1. Add platform badge (Render / Tools / Canvas)
2. Add tool category badges
3. Show tool execution count if tools platform

### 3. Canvas Pages

#### Issues:
- ⚠️ **Still uses legacy chainId** - Should support file-based access
- ❌ **No file-based route** - Missing `/canvas/[projectSlug]/[fileSlug]` route

#### Required Changes:
1. Add new route: `/canvas/[projectSlug]/[fileSlug]/page.tsx`
2. Update canvas editor to support both `chainId` and `fileId`
3. Migrate existing canvas to use files

---

## 🔄 Integration Status by Component

| Component | Platform | Status | Notes |
|-----------|----------|--------|-------|
| `app/render/chat-client.tsx` | Render | ✅ Complete | Uses render chains correctly |
| `app/apps/[toolSlug]/tool-client.tsx` | Tools | ✅ Complete | Uses tool infrastructure |
| `app/canvas/[projectSlug]/[chatId]/page.tsx` | Canvas | ⚠️ Legacy | Uses chainId, needs file support |
| `app/dashboard/projects/page.tsx` | All | ❌ Missing | No platform/tool categorization |
| `components/projects/project-card.tsx` | All | ❌ Missing | No platform/tool indicators |
| `components/tools/base-tool-component.tsx` | Tools | ✅ Complete | Uses tool_executions |
| `lib/hooks/use-tool-renders.ts` | Tools | ✅ Complete | Fetches from tool_executions |

---

## 📋 Action Items

### High Priority
1. ✅ Add `getByUserIdWithPlatformInfo` to ProjectsDAL
2. ⏳ Update dashboard projects page with platform/tool filters
3. ⏳ Add platform badges to project cards
4. ⏳ Update projects hook to fetch platform info

### Medium Priority
5. ⏳ Add file-based canvas route
6. ⏳ Migrate canvas to use files
7. ⏳ Add tool category filtering

### Low Priority
8. ⏳ Add analytics for platform usage
9. ⏳ Add project templates by platform

---

## Next Steps

1. Update `lib/actions/projects.actions.ts` to use `getByUserIdWithPlatformInfo`
2. Update `lib/hooks/use-projects.ts` to include platform info
3. Update `app/dashboard/projects/page.tsx` with filters
4. Update `components/projects/project-card.tsx` with badges

---

**Last Updated**: 2025-01-27

