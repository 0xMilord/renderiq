# Canvas Editor Quick Start Guide

## Installation

### Step 1: Install React Flow

```bash
npm install @xyflow/react
```

### Step 2: Create Route Structure

Create the following directory structure:
```
app/canvas/[projectSlug]/[chatId]/page.tsx
```

### Step 3: Basic Setup

The canvas editor route should:
1. Authenticate the user
2. Fetch project by slug
3. Fetch chain by ID
4. Verify ownership
5. Load canvas graph state
6. Render React Flow canvas

## Quick Implementation Checklist

- [ ] Install `@xyflow/react`
- [ ] Create route: `app/canvas/[projectSlug]/[chatId]/page.tsx`
- [ ] Create base canvas component: `components/canvas/canvas-editor.tsx`
- [ ] Create Text Node: `components/canvas/nodes/text-node.tsx`
- [ ] Create Image Node: `components/canvas/nodes/image-node.tsx`
- [ ] Create Variants Node: `components/canvas/nodes/variants-node.tsx`
- [ ] Create canvas state management
- [ ] Create API endpoints for graph persistence
- [ ] Integrate with existing render API
- [ ] Add database schema for canvas graphs

## Key Integration Points

### Existing APIs to Use

1. **Image Generation**: `/api/ai/generate-image`
   - Already handles prompt, settings, credits
   - Returns render ID and output URL

2. **Prompt Enhancement**: `/api/ai/enhance-prompt`
   - Improves user prompts
   - Returns enhanced prompt

3. **Project/Chain Lookup**:
   - `useProjectBySlug(slug)` hook
   - `useRenderChain(chainId)` hook

4. **Credit System**:
   - `BillingService.deductCredits()`
   - Check credits before generation

### Database Tables

- **Projects**: `projects` table (has `slug`)
- **Chains**: `renderChains` table (has `id`, `projectId`)
- **Renders**: `renders` table (has `chainId`, `outputUrl`)
- **New**: `canvasGraphs` table (store node graph state)

## Example Route Implementation

```typescript
// app/canvas/[projectSlug]/[chatId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useProjectBySlug } from '@/lib/hooks/use-projects';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { CanvasEditor } from '@/components/canvas/canvas-editor';

export default function CanvasPage() {
  const params = useParams();
  const projectSlug = params.projectSlug as string;
  const chatId = params.chatId as string;
  
  const { project, loading: projectLoading } = useProjectBySlug(projectSlug);
  const { chain, loading: chainLoading } = useRenderChain(chatId);
  
  if (projectLoading || chainLoading) {
    return <div>Loading...</div>;
  }
  
  if (!project || !chain) {
    return <div>Not found</div>;
  }
  
  return (
    <CanvasEditor
      projectId={project.id}
      chainId={chain.id}
      projectSlug={projectSlug}
    />
  );
}
```

## Node Connection Flow

```
[Text Node]
    |
    | (prompt: string)
    v
[Image Node]
    |
    | (image: string)
    v
[Variants Node]
    |
    | (variants: string[])
    v
[Output]
```

## Next Steps

1. Read the full specification: `docs/CANVAS_EDITOR_SPEC.md`
2. Start with Phase 1: Foundation
3. Implement nodes one at a time
4. Test each node before moving to the next
5. Integrate with existing APIs incrementally

