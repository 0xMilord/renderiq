# Version Control & Context Management Implementation Prompt

## Overview
Transform the current basic render system into a sophisticated version control and context management system that enables iterative design workflows with AI context preservation.

## Current System Analysis
- **Database**: Has `renderVersions` table but minimal usage
- **Renders**: Basic project-based organization, no context preservation
- **Prompts**: Simple style-based enhancement only
- **UI**: No version selection, no chain visualization, no thumbnails
- **Context**: Each render is independent, AI has no memory

## Implementation Requirements

### 1. Database Schema Updates

#### Add to `renders` table:
```sql
ALTER TABLE renders ADD COLUMN parent_render_id UUID REFERENCES renders(id);
ALTER TABLE renders ADD COLUMN chain_id UUID;
ALTER TABLE renders ADD COLUMN chain_position INTEGER;
ALTER TABLE renders ADD COLUMN reference_render_id UUID REFERENCES renders(id);
ALTER TABLE renders ADD COLUMN context_data JSONB;
ALTER TABLE renders ADD COLUMN thumbnail_url TEXT;
```

#### Create `render_chains` table:
```sql
CREATE TABLE render_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Update `render_versions` table:
```sql
ALTER TABLE render_versions ADD COLUMN reference_render_id UUID REFERENCES renders(id);
ALTER TABLE render_versions ADD COLUMN context_prompt TEXT;
ALTER TABLE render_versions ADD COLUMN thumbnail_url TEXT;
```

### 2. Core Services to Implement

#### A. Chain Management Service (`lib/services/render-chain.ts`)
```typescript
export class RenderChainService {
  // Create new chain
  async createChain(projectId: string, name: string, description?: string): Promise<RenderChain>
  
  // Add render to chain
  async addRenderToChain(chainId: string, renderId: string, position?: number): Promise<void>
  
  // Get chain with renders
  async getChain(chainId: string): Promise<RenderChain>
  
  // Get chains for project
  async getProjectChains(projectId: string): Promise<RenderChain[]>
  
  // Update chain context
  async updateChainContext(chainId: string, context: ChainContext): Promise<void>
  
  // Branch chain (create new direction)
  async branchChain(chainId: string, fromRenderId: string, newName: string): Promise<RenderChain>
}
```

#### B. Context-Aware Prompt Service (`lib/services/context-prompt.ts`)
```typescript
export class ContextPromptService {
  // Build enhanced prompt with context
  async buildContextAwarePrompt(
    userPrompt: string,
    referenceRender?: Render,
    chainContext?: ChainContext,
    style: string,
    imageType?: string
  ): Promise<EnhancedPrompt>
  
  // Extract successful elements from previous renders
  async extractSuccessfulElements(chainId: string): Promise<string[]>
  
  // Build chain evolution context
  async buildChainContext(chainId: string): Promise<string>
  
  // Learn from user feedback
  async updatePromptPreferences(userId: string, feedback: PromptFeedback): Promise<void>
}
```

#### C. Thumbnail Service (`lib/services/thumbnail.ts`)
```typescript
export class ThumbnailService {
  // Generate thumbnail for render
  async generateThumbnail(renderId: string, size: 'small' | 'medium' | 'large'): Promise<string>
  
  // Generate thumbnails for entire chain
  async generateChainThumbnails(chainId: string): Promise<ThumbnailGrid>
  
  // Update thumbnail cache
  async updateThumbnailCache(renderId: string): Promise<void>
  
  // Get thumbnail URL
  async getThumbnailUrl(renderId: string, size: 'small' | 'medium' | 'large'): Promise<string>
}
```

### 3. UI Components to Implement

#### A. Version Selector in Control Bar
```tsx
// Add to control-bar.tsx
interface VersionSelectorProps {
  projectId: string;
  onSelectVersion: (renderId: string) => void;
  selectedVersionId?: string;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({
  projectId,
  onSelectVersion,
  selectedVersionId
}) => {
  // Show dropdown with previous renders
  // Display thumbnails
  // Show context information
  // "Use as Reference" button
}
```

#### B. Chain Visualization Component
```tsx
// New component: components/engines/render-chain.tsx
interface RenderChainProps {
  chainId: string;
  onSelectRender: (renderId: string) => void;
  selectedRenderId?: string;
  isMobile?: boolean;
}

const RenderChain: React.FC<RenderChainProps> = ({
  chainId,
  onSelectRender,
  selectedRenderId,
  isMobile
}) => {
  // Horizontal scrollable thumbnail row
  // Click to select version
  // Visual indicators for chain position
  // Branch visualization
}
```

#### C. Enhanced Render Preview
```tsx
// Update render-preview.tsx
interface RenderPreviewProps {
  result?: RenderResult;
  chainId?: string;
  onSelectVersion?: (renderId: string) => void;
  // ... existing props
}

// Add chain visualization above main render
// Show version navigation
// Display context information
```

### 4. Enhanced Data Access Layer

#### Update `RendersDAL` (`lib/dal/renders.ts`)
```typescript
export class RendersDAL {
  // Get renders by chain
  static async getByChainId(chainId: string): Promise<Render[]>
  
  // Get render with context
  static async getWithContext(renderId: string): Promise<RenderWithContext>
  
  // Update render context
  static async updateContext(renderId: string, context: ContextData): Promise<void>
  
  // Get reference renders for project
  static async getReferenceRenders(projectId: string): Promise<Render[]>
  
  // Create render with chain context
  static async createWithChain(data: CreateRenderData & { chainId: string, referenceRenderId?: string }): Promise<Render>
}
```

#### Create `RenderChainsDAL` (`lib/dal/render-chains.ts`)
```typescript
export class RenderChainsDAL {
  static async create(data: CreateChainData): Promise<RenderChain>
  static async getById(id: string): Promise<RenderChain | null>
  static async getByProjectId(projectId: string): Promise<RenderChain[]>
  static async update(id: string, data: UpdateChainData): Promise<RenderChain>
  static async delete(id: string): Promise<void>
  static async addRender(chainId: string, renderId: string, position?: number): Promise<void>
  static async removeRender(chainId: string, renderId: string): Promise<void>
}
```

### 5. Enhanced Hooks

#### Update `useRenders` (`lib/hooks/use-renders.ts`)
```typescript
export function useRenders(projectId: string | null) {
  // Add chain support
  const [chains, setChains] = useState<RenderChain[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  
  // Get chains for project
  const fetchChains = useCallback(async () => { /* ... */ }, [projectId]);
  
  // Get renders for selected chain
  const fetchChainRenders = useCallback(async () => { /* ... */ }, [selectedChainId]);
  
  return {
    renders,
    chains,
    selectedChainId,
    setSelectedChainId,
    fetchChains,
    fetchChainRenders,
    // ... existing returns
  };
}
```

#### Create `useRenderChain` (`lib/hooks/use-render-chain.ts`)
```typescript
export function useRenderChain(chainId: string | null) {
  const [chain, setChain] = useState<RenderChain | null>(null);
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch chain data
  // Manage chain operations
  // Handle version selection
}
```

### 6. Enhanced Image Generation

#### Update `GoogleAIService` (`lib/services/google-ai.ts`)
```typescript
// Add context-aware prompt building
private buildContextAwarePrompt(
  userPrompt: string,
  referenceRender?: Render,
  chainContext?: ChainContext,
  style: string,
  imageType?: string
): string {
  // Build enhanced prompt with:
  // - Reference render context
  // - Chain evolution context
  // - Successful elements from previous renders
  // - User preferences
  // - Style modifiers
}
```

### 7. Server Actions Updates

#### Update `projects.actions.ts`
```typescript
// Add chain management actions
export async function createRenderChain(projectId: string, name: string, description?: string)
export async function getProjectChains(projectId: string)
export async function addRenderToChain(chainId: string, renderId: string, position?: number)
export async function selectRenderVersion(renderId: string, asReference: boolean)
export async function getRenderChain(chainId: string)
```

### 8. API Endpoints

#### Update `/api/renders/route.ts`
```typescript
// Add chain support to existing endpoints
// Add new endpoints:
// GET /api/renders/chains?projectId=xxx
// POST /api/renders/chains
// GET /api/renders/chains/[chainId]
// POST /api/renders/chains/[chainId]/renders
// PUT /api/renders/[renderId]/context
```

## Implementation Order

### Phase 1: Database & Core Services
1. Create database migrations
2. Update schema types
3. Implement RenderChainService
4. Implement ContextPromptService
5. Implement ThumbnailService
6. Update DAL classes

### Phase 2: Enhanced Image Generation
1. Update GoogleAIService with context awareness
2. Enhance prompt building
3. Add reference image support
4. Test context-aware generation

### Phase 3: UI Components
1. Create VersionSelector component
2. Create RenderChain component
3. Update ControlBar with version selection
4. Update RenderPreview with chain visualization
5. Add thumbnail generation

### Phase 4: Hooks & State Management
1. Update useRenders hook
2. Create useRenderChain hook
3. Update state management
4. Add chain operations

### Phase 5: Server Actions & API
1. Update existing actions
2. Add new chain actions
3. Update API endpoints
4. Add context management

### Phase 6: Testing & Refinement
1. Test complete workflow
2. Fix bugs and edge cases
3. Optimize performance
4. Add error handling
5. User experience improvements

## Key Features to Implement

### 1. **Version Selection in Control Bar**
- Dropdown showing previous renders with thumbnails
- "Use as Reference" functionality
- Context information display
- Chain selection

### 2. **Chain Visualization**
- Horizontal scrollable thumbnail row
- Click to select version
- Visual chain position indicators
- Branch visualization for different directions

### 3. **Context-Aware Prompts**
- Reference previous render context
- Chain evolution context
- Successful elements from history
- User preference learning

### 4. **Thumbnail System**
- Auto-generated thumbnails
- Multiple sizes (small, medium, large)
- Caching system
- Grid layout

### 5. **Enhanced Render Preview**
- Chain visualization above main render
- Version navigation
- Context information display
- Comparison tools

## Success Criteria

1. **Context Preservation**: AI maintains awareness of previous iterations
2. **Workflow Continuity**: Users can build upon previous work seamlessly
3. **Visual Navigation**: Easy to see and select from all versions
4. **Iterative Improvement**: Clear progression and branching capabilities
5. **Better Results**: Context-aware prompts produce superior outputs
6. **User Experience**: Intuitive workflow management
7. **Performance**: Fast thumbnail generation and chain operations

## Technical Considerations

- **Database Performance**: Index on chain_id, parent_render_id
- **Thumbnail Storage**: Use Supabase Storage with CDN
- **Context Size**: Limit context data to prevent prompt bloat
- **Caching**: Cache thumbnails and chain data
- **Error Handling**: Graceful fallbacks for missing context
- **Mobile Support**: Responsive chain visualization

This implementation will transform the basic render system into a powerful, context-aware, iterative design tool that maintains workflow continuity and produces better results through context preservation.
