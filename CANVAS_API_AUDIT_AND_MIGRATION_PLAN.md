# Canvas API Routes Audit & Migration Plan

**Date**: 2025-01-27  
**Status**: 🔍 **AUDIT COMPLETE** - Migration Plan Ready

---

## Executive Summary

**Total Canvas API Routes**: 3  
**Routes to Migrate**: 3  
**Routes Safe to Remove**: 2 (after migration)  
**Routes Requiring Legacy Support**: 1 (chainId-based graph)

---

## Canvas Database Schema

### Tables Structure

#### 1. `canvasFiles` Table
```typescript
{
  id: uuid (PK)
  projectId: uuid (FK → projects.id)
  userId: uuid (FK → users.id)
  name: text
  slug: text
  description: text
  thumbnailUrl: text
  thumbnailKey: text
  version: integer
  isActive: boolean
  isArchived: boolean
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. `canvasGraphs` Table
```typescript
{
  id: uuid (PK)
  chainId: uuid (FK → renderChains.id) // ⚠️ LEGACY - nullable for backward compatibility
  fileId: uuid (FK → canvasFiles.id) // ✅ NEW - required for new records
  projectId: uuid (FK → projects.id)
  userId: uuid (FK → users.id)
  nodes: jsonb
  connections: jsonb
  viewport: jsonb
  version: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 3. `canvasFileVersions` Table
```typescript
{
  id: uuid (PK)
  fileId: uuid (FK → canvasFiles.id)
  version: integer
  graphId: uuid (FK → canvasGraphs.id)
  name: text
  description: text
  createdBy: uuid (FK → users.id)
  createdAt: timestamp
}
```

**Key Points**:
- ✅ **New Structure**: Project → File → Graph (Figma-like)
- ⚠️ **Legacy Support**: `chainId` in `canvasGraphs` is nullable for backward compatibility
- ✅ **Unique Constraint**: One graph per file (`fileIdUnique` index)

---

## Canvas API Routes Analysis

### 1. `/api/canvas/upload-thumbnail` ⚠️ **NEEDS MIGRATION**

**File**: `app/api/canvas/upload-thumbnail/route.ts`

**Current Implementation**:
- **Method**: POST
- **Functionality**: Uploads thumbnail image for canvas file
- **Process**:
  1. Receives file and fileId from FormData
  2. Uploads to storage via `StorageService.uploadFile`
  3. Updates canvas file via `updateCanvasFileAction` (already using server action!)

**Current Usage**:
- ✅ `lib/utils/canvas-screenshot.ts` - `uploadCanvasScreenshot()` function

**Server Action Needed**: 
- ✅ Create `uploadCanvasThumbnailAction()` in `canvas-files.actions.ts`

**Status**: ⚠️ **CAN MIGRATE** - Already uses server action internally, just needs wrapper

---

### 2. `/api/canvas/generate-variants` ⚠️ **NEEDS MIGRATION**

**File**: `app/api/canvas/generate-variants/route.ts`

**Current Implementation**:
- **Method**: POST
- **Functionality**: Generates multiple image variants
- **Process**:
  1. Checks user credits
  2. Creates render records for each variant
  3. Deducts credits
  4. Returns variant data

**Current Usage**:
- ✅ `lib/hooks/use-node-execution.ts` - `generateVariants()` function

**Server Action Needed**: 
- ✅ Create `generateCanvasVariantsAction()` in `canvas-files.actions.ts`

**Status**: ⚠️ **CAN MIGRATE** - Uses existing services (BillingService, RendersDAL)

---

### 3. `/api/canvas/[chainId]/graph` ⚠️ **LEGACY ROUTE - NEEDS MIGRATION**

**File**: `app/api/canvas/[chainId]/graph/route.ts`

**Current Implementation**:
- **Methods**: GET, POST
- **Functionality**: Get/save canvas graph state using chainId (legacy)
- **Process**:
  - GET: Fetches graph by chainId, verifies chain/project ownership
  - POST: Saves graph state using chainId

**Current Usage**:
- ❌ **No active usage found** - This is a legacy route
- ⚠️ **Note**: Schema shows `chainId` is nullable in `canvasGraphs` for backward compatibility
- ✅ **New structure uses fileId** - All new canvas operations use fileId

**Server Actions Available**:
- ✅ `getCanvasGraphAction(fileId)` - Already exists (uses fileId)
- ✅ `saveCanvasGraphAction(fileId, state)` - Already exists (uses fileId)

**Legacy Support Options**:
1. **Option A**: Create legacy server actions that convert chainId → fileId
2. **Option B**: Deprecate chainId-based access entirely (if no usage found)
3. **Option C**: Keep API route for legacy support only (not recommended)

**Status**: ⚠️ **LEGACY ROUTE** - Should migrate to fileId-based actions

---

## Migration Plan

### Phase 1: Create Missing Server Actions ✅

#### 1. `uploadCanvasThumbnailAction(fileId: string, file: File)`
**Location**: `lib/actions/canvas-files.actions.ts`

**Implementation**:
```typescript
export async function uploadCanvasThumbnailAction(fileId: string, file: File) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Upload to storage
    const uploadResult = await StorageService.uploadFile(
      file,
      'uploads',
      user.id,
      `canvas-thumbnails/${fileId}-${Date.now()}.png`
    );

    // Update canvas file with thumbnail
    const updateFormData = new FormData();
    updateFormData.append('thumbnailUrl', uploadResult.url);
    updateFormData.append('thumbnailKey', uploadResult.key);

    const updateResult = await updateCanvasFileAction(fileId, updateFormData);
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    return {
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
    };
  } catch (error) {
    logger.error('Error uploading canvas thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload thumbnail',
    };
  }
}
```

#### 2. `generateCanvasVariantsAction(params: GenerateVariantsParams)`
**Location**: `lib/actions/canvas-files.actions.ts`

**Implementation**:
```typescript
export async function generateCanvasVariantsAction(params: {
  sourceImageUrl: string;
  prompt: string;
  count: number;
  settings: Record<string, any>;
  nodeId?: string;
}) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check credits
    const creditsResult = await BillingService.getUserCredits(user.id);
    if (!creditsResult.success || !creditsResult.credits) {
      return { success: false, error: 'Failed to check credits' };
    }

    const requiredCredits = params.count;
    if (creditsResult.credits.balance < requiredCredits) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Generate variants
    const variants = [];
    for (let i = 0; i < params.count; i++) {
      const renderResult = await RendersDAL.create({
        userId: user.id,
        type: 'image',
        prompt: params.prompt || 'Variant',
        settings: {
          style: params.settings.style || 'architectural',
          quality: params.settings.quality || 'standard',
          aspectRatio: '16:9',
        },
        status: 'pending',
      });

      variants.push({
        id: renderResult.id,
        url: params.sourceImageUrl,
        prompt: params.prompt || 'Variant',
        settings: params.settings,
        renderId: renderResult.id,
      });
    }

    // Deduct credits
    await BillingService.deductCredits(
      user.id,
      requiredCredits,
      `Generated ${params.count} variants`,
      undefined,
      'render'
    );

    return {
      success: true,
      data: { variants },
    };
  } catch (error) {
    logger.error('Error generating variants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate variants',
    };
  }
}
```

#### 3. Legacy Support: `getCanvasGraphByChainIdAction(chainId: string)` (Optional)
**Location**: `lib/actions/canvas-files.actions.ts`

**Note**: Only create if chainId-based access is still needed. Otherwise, deprecate.

---

### Phase 2: Migrate Component Usage ✅

#### 1. `lib/utils/canvas-screenshot.ts`
**Current**: Uses `/api/canvas/upload-thumbnail`
**Migration**: Replace with `uploadCanvasThumbnailAction()`

#### 2. `lib/hooks/use-node-execution.ts`
**Current**: Uses `/api/canvas/generate-variants`
**Migration**: Replace with `generateCanvasVariantsAction()`

#### 3. Legacy Graph Route
**Current**: `/api/canvas/[chainId]/graph` (no active usage found)
**Migration**: 
- If no usage found → **DEPRECATE IMMEDIATELY**
- If usage found → Create legacy server action or migrate to fileId

---

### Phase 3: Delete API Routes ✅

After migration:
1. ✅ Delete `app/api/canvas/upload-thumbnail/route.ts`
2. ✅ Delete `app/api/canvas/generate-variants/route.ts`
3. ⚠️ Delete `app/api/canvas/[chainId]/graph/route.ts` (if no usage found)

---

## Detailed Findings

### ✅ Routes Already Using Server Actions

1. **`/api/canvas/upload-thumbnail`** - Already calls `updateCanvasFileAction()` internally
   - **Status**: Easy migration - just create wrapper server action

### ⚠️ Routes Requiring New Server Actions

1. **`/api/canvas/generate-variants`** - Needs new server action
   - **Complexity**: Medium (uses BillingService, RendersDAL)
   - **Dependencies**: Already available

2. **`/api/canvas/[chainId]/graph`** - Legacy route
   - **Status**: No active usage found
   - **Recommendation**: Deprecate if no usage, or create legacy wrapper

---

## Files to Update

### 1. Create Server Actions
- `lib/actions/canvas-files.actions.ts` - Add 2-3 new actions

### 2. Migrate Components
- `lib/utils/canvas-screenshot.ts` - Replace API call
- `lib/hooks/use-node-execution.ts` - Replace API call

### 3. Delete API Routes
- `app/api/canvas/upload-thumbnail/route.ts`
- `app/api/canvas/generate-variants/route.ts`
- `app/api/canvas/[chainId]/graph/route.ts` (if no usage)

---

## Verification Checklist

- ✅ All canvas API routes identified
- ✅ Schema structure understood
- ✅ Current usage found
- ⚠️ Legacy chainId route usage - **NEEDS VERIFICATION**
- ✅ Server actions plan created
- ✅ Migration plan ready

---

## Status: ⚠️ **READY FOR MIGRATION**

**Next Steps**:
1. Verify no usage of `/api/canvas/[chainId]/graph`
2. Create missing server actions
3. Migrate component usage
4. Delete API routes

---

**Report Generated**: 2025-01-27  
**Total Routes**: 3  
**Routes to Migrate**: 3  
**Estimated Migration Time**: 1-2 hours

