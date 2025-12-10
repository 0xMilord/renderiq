# Plan Limits Infrastructure - Completion Guide

## ✅ Completed
1. Backend services, actions, API routes, hooks, and UI components are all in place
2. API route `/api/renders` now has limit checks (added PlanLimitsService import and checks)
3. CreateProjectModal already has limit dialog integration

## 🔧 Remaining Tasks

### 1. UnifiedChatInterface - Add Limit Dialog
**File:** `components/chat/unified-chat-interface.tsx`

**Add imports:**
```typescript
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import type { LimitType } from '@/lib/services/plan-limits.service';
```

**Add state (around line 225):**
```typescript
const [limitDialogOpen, setLimitDialogOpen] = useState(false);
const [limitDialogData, setLimitDialogData] = useState<{
  limitType: LimitType;
  current: number;
  limit: number | null;
  planName: string;
  message?: string;
} | null>(null);
```

**Update error handling (around line 1468):**
```typescript
} else {
  // Store error message for catch block
  apiError = apiResult.error || 'Image generation failed';
  
  // ✅ CHECK: Handle limit errors - show limit dialog instead of generic error
  if (apiResult.limitReached) {
    setLimitDialogData({
      limitType: apiResult.limitType || 'credits',
      current: apiResult.current || 0,
      limit: apiResult.limit ?? null,
      planName: apiResult.planName || 'Free',
      message: apiError,
    });
    setLimitDialogOpen(true);
    return; // Exit early - don't proceed with error handling
  }
  
  // ... rest of error handling
}
```

**Add dialog component at end of JSX return (before closing component):**
```typescript
{limitDialogData && (
  <LimitReachedDialog
    isOpen={limitDialogOpen}
    onClose={() => {
      setLimitDialogOpen(false);
      setLimitDialogData(null);
    }}
    limitType={limitDialogData.limitType}
    current={limitDialogData.current}
    limit={limitDialogData.limit}
    planName={limitDialogData.planName}
    message={limitDialogData.message}
  />
)}
```

### 2. BaseToolComponent - Add Limit Dialog
**File:** `components/tools/base-tool-component.tsx`

**Add imports:**
```typescript
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import type { LimitType } from '@/lib/services/plan-limits.service';
```

**Add state (around line 100):**
```typescript
const [limitDialogOpen, setLimitDialogOpen] = useState(false);
const [limitDialogData, setLimitDialogData] = useState<{
  limitType: LimitType;
  current: number;
  limit: number | null;
  planName: string;
  message?: string;
} | null>(null);
```

**Update error handling (around line 491):**
```typescript
} else {
  // ✅ CHECK: Handle limit errors
  if ((result as any).limitReached) {
    const limitData = result as any;
    setLimitDialogData({
      limitType: limitData.limitType || 'credits',
      current: limitData.current || 0,
      limit: limitData.limit ?? null,
      planName: limitData.planName || 'Free',
      message: result.error,
    });
    setLimitDialogOpen(true);
    return; // Exit early
  }
  throw new Error(result.error || 'Failed to generate render');
}
```

**Add dialog component at end of JSX return (before closing component):**
```typescript
{limitDialogData && (
  <LimitReachedDialog
    isOpen={limitDialogOpen}
    onClose={() => {
      setLimitDialogOpen(false);
      setLimitDialogData(null);
    }}
    limitType={limitDialogData.limitType}
    current={limitDialogData.current}
    limit={limitDialogData.limit}
    planName={limitDialogData.planName}
    message={limitDialogData.message}
  />
)}
```

### 3. Verify API Route Limit Checks
**File:** `app/api/renders/route.ts`

✅ Already added PlanLimitsService import
✅ Need to verify limit checks are in place (should be around line 279-330)

## Testing Checklist
- [ ] Test project limit reached in CreateProjectModal
- [ ] Test quality limit in UnifiedChatInterface
- [ ] Test video limit in UnifiedChatInterface
- [ ] Test renders per project limit in UnifiedChatInterface
- [ ] Test credits limit in UnifiedChatInterface
- [ ] Test quality limit in BaseToolComponent
- [ ] Test video limit in BaseToolComponent
- [ ] Test credits limit in BaseToolComponent
- [ ] Verify upgrade modal triggers checkout directly
- [ ] Verify all limit dialogs show correct messages

