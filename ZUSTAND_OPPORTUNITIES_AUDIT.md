# Zustand Store Opportunities - Comprehensive Audit

**Date**: 2025-01-27  
**Status**: Analysis Complete  
**Purpose**: Identify areas that would **extremely benefit** from Zustand stores

## 🎯 High-Priority Opportunities

### 1. **Project/Chain Selection Store** ⭐⭐⭐⭐⭐
**Priority**: **CRITICAL** - Used across multiple components

**Current State**:
- `app/render/chat-client.tsx`: 20+ useState hooks including `selectedProjectId`, `selectedChainId`
- `components/navbar-selectors.tsx`: Duplicate `selectedProjectId` state
- State is passed through props and URL params
- No persistence - selection lost on refresh

**Benefits**:
- ✅ **Single source of truth** for project/chain selection
- ✅ **Cross-component sharing** (navbar, sidebar, main content)
- ✅ **Persistence** - Remember last selected project/chain
- ✅ **URL sync** - Keep URL and store in sync
- ✅ **Eliminate prop drilling**

**Store Structure**:
```typescript
interface ProjectChainState {
  selectedProjectId: string | null;
  selectedChainId: string | null;
  projects: Project[];
  chains: ChainWithRenders[];
  
  // Actions
  setSelectedProject: (projectId: string | null) => void;
  setSelectedChain: (chainId: string | null) => void;
  setProjects: (projects: Project[]) => void;
  setChains: (chains: ChainWithRenders[]) => void;
  clearSelection: () => void;
}
```

**Files Affected**:
- `app/render/chat-client.tsx` (20+ useState hooks)
- `components/navbar-selectors.tsx`
- `app/project/[projectSlug]/chain/[chainId]/page.tsx`
- `app/dashboard/projects/[slug]/page.tsx`

---

### 2. **UI Preferences Store** ⭐⭐⭐⭐⭐
**Priority**: **HIGH** - User experience improvements

**Current State**:
- `app/render/chat-client.tsx`: `viewMode`, `sidebarView`, `isSidebarOpen`
- `app/dashboard/projects/[slug]/page.tsx`: `viewMode`, `searchQuery`, `sortBy`, `filterStatus`
- `components/tools/base-tool-component.tsx`: `activeTab`
- No persistence - preferences reset on refresh

**Benefits**:
- ✅ **Persist user preferences** (view mode, sidebar state, etc.)
- ✅ **Consistent UI across pages**
- ✅ **Better UX** - Remember user's preferred layout

**Store Structure**:
```typescript
interface UIPreferencesState {
  // View modes
  viewMode: 'default' | 'compact' | 'list';
  sidebarView: 'tree' | 'all';
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Tool-specific
  activeTab: 'tool' | 'output';
  
  // Filters & Search
  searchQuery: string;
  sortBy: string;
  filterStatus: string;
  
  // Actions
  setViewMode: (mode: 'default' | 'compact' | 'list') => void;
  setSidebarView: (view: 'tree' | 'all') => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: 'tool' | 'output') => void;
  // ... other setters
}
```

**Files Affected**:
- `app/render/chat-client.tsx`
- `app/dashboard/projects/[slug]/page.tsx`
- `components/tools/base-tool-component.tsx`
- `components/chat/unified-chat-interface.tsx` (isSidebarCollapsed)

---

### 3. **Tool Settings Store** ⭐⭐⭐⭐
**Priority**: **HIGH** - Shared across tool components

**Current State**:
- `components/tools/base-tool-component.tsx`: 15+ useState hooks for tool settings
- Settings duplicated across different tool instances
- No persistence - settings reset when navigating away

**Benefits**:
- ✅ **Persist tool preferences** (quality, aspect ratio, model, etc.)
- ✅ **Share settings across tool instances**
- ✅ **Better UX** - Remember user's preferred settings

**Store Structure**:
```typescript
interface ToolSettingsState {
  // Image/Video settings
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  style: string;
  selectedModel: string | undefined;
  videoDuration: 4 | 6 | 8;
  videoModel: string;
  enableAudio: boolean;
  
  // Upload state
  images: File[];
  previews: string[];
  galleryImageUrl: string | null;
  
  // Actions
  setQuality: (quality: 'standard' | 'high' | 'ultra') => void;
  setAspectRatio: (ratio: string) => void;
  setStyle: (style: string) => void;
  setSelectedModel: (model: string | undefined) => void;
  // ... other setters
  resetSettings: () => void;
}
```

**Files Affected**:
- `components/tools/base-tool-component.tsx` (15+ useState hooks)
- All tool-specific components

**Note**: This is similar to `chat-settings-store.ts` but for standalone tools. Could potentially merge or create a shared base.

---

### 4. **Canvas Editor Store** ⭐⭐⭐⭐
**Priority**: **MEDIUM-HIGH** - Complex state management

**Current State**:
- `components/canvas/canvas-editor.tsx`: Complex state with nodes, edges, history
- Uses ReactFlow's `useNodesState` and `useEdgesState`
- History managed via class instance
- Node statuses, search, multi-select all in component state

**Benefits**:
- ✅ **Centralized canvas state** for easier debugging
- ✅ **Better DevTools integration**
- ✅ **Easier undo/redo** management
- ✅ **Cross-component canvas state sharing**

**Store Structure**:
```typescript
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  history: HistoryState[];
  currentHistoryIndex: number;
  nodeStatuses: Map<string, NodeExecutionStatus>;
  searchQuery: string;
  highlightedNodeIds: string[];
  isCapturingScreenshot: boolean;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  undo: () => void;
  redo: () => void;
  // ... other actions
}
```

**Files Affected**:
- `components/canvas/canvas-editor.tsx`
- `components/canvas/canvas-toolbar.tsx`
- `components/canvas/canvas-controls.tsx`

**Note**: ReactFlow has its own state management. Need to evaluate if Zustand would conflict or complement.

---

### 5. **Modal/Dialog State Store** ⭐⭐⭐
**Priority**: **MEDIUM** - Better UX and state management

**Current State**:
- Multiple components manage modal state independently
- `app/render/chat-client.tsx`: `isImageModalOpen`, `editProjectModalOpen`, `duplicateProjectModalOpen`, `deleteProjectDialogOpen`
- `components/tools/base-tool-component.tsx`: `isDialogOpen`, `isUploadModalOpen`, `isGalleryModalOpen`, `limitDialogOpen`
- `components/chat/unified-chat-interface.tsx`: `isPromptGalleryOpen`, `isPromptBuilderOpen`, `limitDialogOpen`

**Benefits**:
- ✅ **Centralized modal management**
- ✅ **Prevent multiple modals open simultaneously**
- ✅ **Better keyboard navigation** (ESC to close all)
- ✅ **Easier to track which modals are open**

**Store Structure**:
```typescript
interface ModalState {
  // Modal visibility
  isImageModalOpen: boolean;
  isProjectEditModalOpen: boolean;
  isProjectDuplicateModalOpen: boolean;
  isProjectDeleteDialogOpen: boolean;
  isUploadModalOpen: boolean;
  isGalleryModalOpen: boolean;
  isPromptGalleryOpen: boolean;
  isPromptBuilderOpen: boolean;
  limitDialogOpen: boolean;
  
  // Modal data
  selectedRender: Render | null;
  limitDialogData: LimitDialogData | null;
  
  // Actions
  openModal: (modalName: string, data?: any) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;
}
```

**Files Affected**:
- `app/render/chat-client.tsx`
- `components/tools/base-tool-component.tsx`
- `components/chat/unified-chat-interface.tsx`
- All modal components

---

### 6. **Search & Filter Store** ⭐⭐⭐
**Priority**: **MEDIUM** - Better state management

**Current State**:
- `app/render/chat-client.tsx`: `searchQuery`, `chainSearchQuery`, `projectSearchQuery`, `chainSortBy`, `projectSortBy`
- `app/apps/apps-client.tsx`: `searchQuery`, `selectedCategory`
- `app/dashboard/projects/[slug]/page.tsx`: `searchQuery`, `sortBy`, `filterStatus`
- State is component-local, lost on navigation

**Benefits**:
- ✅ **Persist search/filter preferences**
- ✅ **Share filters across related pages**
- ✅ **Better UX** - Remember user's filters

**Store Structure**:
```typescript
interface SearchFilterState {
  // Global search
  globalSearchQuery: string;
  
  // Project/Chain filters
  projectSearchQuery: string;
  projectSortBy: string;
  chainSearchQuery: string;
  chainSortBy: string;
  
  // Tool filters
  toolSearchQuery: string;
  toolCategory: ToolCategory | 'all';
  
  // Render filters
  renderSearchQuery: string;
  renderSortBy: string;
  renderFilterStatus: string;
  
  // Actions
  setGlobalSearch: (query: string) => void;
  setProjectFilters: (search: string, sortBy: string) => void;
  setChainFilters: (search: string, sortBy: string) => void;
  // ... other setters
  clearAllFilters: () => void;
}
```

**Files Affected**:
- `app/render/chat-client.tsx`
- `app/apps/apps-client.tsx`
- `app/dashboard/projects/[slug]/page.tsx`

---

## 📊 Summary by Priority

| Priority | Store | Impact | Effort | Files Affected |
|----------|-------|--------|--------|----------------|
| ⭐⭐⭐⭐⭐ | Project/Chain Selection | Very High | Medium | 4+ files, 20+ useState |
| ⭐⭐⭐⭐⭐ | UI Preferences | High | Low | 4+ files, 10+ useState |
| ⭐⭐⭐⭐ | Tool Settings | High | Medium | 1 file, 15+ useState |
| ⭐⭐⭐⭐ | Canvas Editor | Medium-High | High | 3+ files, complex state |
| ⭐⭐⭐ | Modal/Dialog State | Medium | Low | 3+ files, 10+ useState |
| ⭐⭐⭐ | Search & Filter | Medium | Low | 3+ files, 8+ useState |

---

## 🚀 Recommended Implementation Order

1. **Project/Chain Selection Store** (Week 1)
   - Highest impact, eliminates most prop drilling
   - Used across multiple critical components
   - Immediate UX improvement (persistence)

2. **UI Preferences Store** (Week 1-2)
   - Quick win, low effort
   - High user satisfaction
   - Can be done in parallel with #1

3. **Tool Settings Store** (Week 2)
   - Consolidates many useState hooks
   - Better UX (persist preferences)
   - Similar pattern to chat-settings-store

4. **Modal/Dialog State Store** (Week 2-3)
   - Low effort, good organization
   - Prevents modal conflicts
   - Better keyboard navigation

5. **Search & Filter Store** (Week 3)
   - Low effort, good UX
   - Persist user preferences
   - Can be done incrementally

6. **Canvas Editor Store** (Week 4+)
   - Most complex, needs careful evaluation
   - May conflict with ReactFlow's state management
   - Evaluate if Zustand adds value vs. current approach

---

## 💡 Additional Considerations

### Shared Settings Pattern
Consider creating a **base settings store** that both `chat-settings-store` and `tool-settings-store` can extend, since they share many common fields (quality, aspectRatio, model, etc.).

### URL State Sync
For stores like `project-chain-store`, consider using a middleware to sync with URL params automatically, ensuring URL and store stay in sync.

### DevTools Integration
All Zustand stores automatically get Redux DevTools integration, making debugging much easier.

### Performance
Zustand's selective subscriptions mean components only re-render when their specific slice of state changes, improving performance over prop drilling.

---

## 📝 Next Steps

1. Create `lib/stores/project-chain-store.ts`
2. Create `lib/stores/ui-preferences-store.ts`
3. Create `lib/stores/tool-settings-store.ts`
4. Migrate components incrementally
5. Test persistence and cross-component sharing
6. Monitor performance improvements

