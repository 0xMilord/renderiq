# tldraw ↔ Zustand State Management Sync Audit

**Date**: 2025-01-27  
**Status**: 🔍 **AUDIT COMPLETE**  
**tldraw Version**: 4.2.1  
**Zustand Stores**: 8 stores (auth, chat, chat-settings, ui-preferences, search-filter, tool-settings, project-chain, modal)

---

## 📋 Executive Summary

**Current State**: tldraw canvas state is **NOT** integrated with Zustand stores. Canvas state is managed entirely through:
- **Database persistence** (`render.contextData.tldrawCanvasState`)
- **tldraw's internal store** (`editor.store`)
- **Server actions** for load/save (`loadChainCanvasStateAction`, `saveChainCanvasStateAction`)

**Key Finding**: Canvas state exists in isolation from your Zustand architecture, which means:
- ❌ No cross-component canvas state sharing
- ❌ No localStorage persistence for canvas state
- ❌ No reactive updates when canvas changes
- ✅ Props (`chainId`, `currentRender`) are passed correctly
- ✅ Auto-save to database works correctly

---

## 🔍 Current Architecture

### 1. **tldraw State Management (tldraw v4.2.1)**

tldraw v4 uses **Signia** (reactive state management) internally:
- **Store**: `editor.store` (tldraw's internal store)
- **Snapshot API**: `getSnapshot(editor.store)` / `loadSnapshot(editor.store, snapshot)`
- **State Structure**: `{ document, session }` where:
  - `document`: Shapes, pages, assets (persistent)
  - `session`: Editor state, camera, selection (ephemeral)

**tldraw v4 Best Practices** (from docs):
- Use `getSnapshot()` for serialization
- Use `loadSnapshot()` for restoration
- Listen to `editor.store.listen()` for changes
- Store snapshots in external storage (database, localStorage)

### 2. **Current Implementation Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ unified-chat-interface.tsx                                   │
│  - Gets chainId, currentRender from props                    │
│  - Gets messages, inputValue from useChatStore()            │
│  - Gets isGenerating, progress from useChatStore()          │
│  - Passes chainId, currentRender to RenderiqCanvas          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Props: chainId, currentRender
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ RenderiqCanvas Component                                     │
│  - Receives chainId, currentRender as props                 │
│  - Uses useRenderiqCanvas({ chainId, currentRenderId })     │
│  - Creates tldraw Editor instance                           │
│  - Auto-saves to database via server actions                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ useRenderiqCanvas Hook                                       │
│  - Loads state: loadChainCanvasStateAction(chainId)         │
│  - Saves state: saveChainCanvasStateAction(chainId, state)  │
│  - Listens: editor.store.listen() → auto-save (2s debounce)│
│  - Storage: render.contextData.tldrawCanvasState (DB only)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Database (PostgreSQL)                                        │
│  - renders.context_data.tldrawCanvasState                   │
│  - Structure: { version, canvasData: TLStoreSnapshot }      │
└─────────────────────────────────────────────────────────────┘
```

### 3. **What's Missing: Zustand Integration**

**Current Gap**: Canvas state is **NOT** in a Zustand store. This means:

1. **No Cross-Component Sharing**
   - Canvas state can't be accessed by other components
   - Can't sync canvas selection with other UI elements
   - Can't share canvas state across routes

2. **No localStorage Persistence**
   - Canvas state only persists to database
   - No offline support
   - No instant restoration on page load

3. **No Reactive Updates**
   - Other components can't react to canvas changes
   - Can't show canvas state in sidebar/navbar
   - Can't sync canvas with chat messages

4. **Prop Drilling Still Exists**
   - `chainId` and `currentRender` passed as props
   - Should come from `useProjectChainStore()` instead

---

## 🔧 Detailed Component Analysis

### **unified-chat-interface.tsx** (Lines 4251-4292)

**Current Implementation**:
```typescript
<RenderiqCanvas
  currentRender={renderWithLatestData || null}  // ❌ Should come from store
  chainId={chainId}                            // ❌ Should come from store
  chainRenders={chain?.renders || []}          // ❌ Should come from store
  isGenerating={isGenerating || ...}            // ✅ From useChatStore()
  generatingPrompt={inputValue}                 // ✅ From useChatStore()
  onGenerateFromSelection={(prompt, selectedRenderIds) => {
    setInputValue(prompt || inputValue);        // ✅ Uses store
    handleSendMessage();
  }}
/>
```

**Issues**:
1. ❌ `chainId` passed as prop instead of `useProjectChainStore().selectedChainId`
2. ❌ `currentRender` passed as prop instead of `useChatStore().currentRender`
3. ❌ `chain?.renders` passed as prop instead of `useProjectChainStore().chains.find(...)?.renders`
4. ✅ `isGenerating`, `inputValue` correctly from `useChatStore()`
5. ✅ `setInputValue()` correctly uses store

**What Should Happen**:
```typescript
// Get from stores instead of props
const { selectedChainId } = useProjectChainStore();
const { currentRender, isGenerating, inputValue, setInputValue } = useChatStore();
const { chains } = useProjectChainStore();
const chainRenders = chains.find(c => c.id === selectedChainId)?.renders || [];

<RenderiqCanvas
  currentRender={currentRender}              // ✅ From store
  chainId={selectedChainId}                  // ✅ From store
  chainRenders={chainRenders}                // ✅ From store
  isGenerating={isGenerating}
  generatingPrompt={inputValue}
  onGenerateFromSelection={(prompt, selectedRenderIds) => {
    setInputValue(prompt || inputValue);
    handleSendMessage();
  }}
/>
```

### **RenderiqCanvas Component** (components/canvas/renderiq-canvas.tsx)

**Current Implementation**:
```typescript
export function RenderiqCanvas({
  currentRender,      // ❌ Prop - should come from store
  chainId,           // ❌ Prop - should come from store
  chainRenders,      // ❌ Prop - should come from store
  ...
}: RenderiqCanvasProps) {
  const { editor, setEditor, isLoading } = useRenderiqCanvas({
    chainId,                    // ❌ From prop
    currentRenderId: currentRender?.id,  // ❌ From prop
    autoSave: true,
  });
  
  // Canvas state managed entirely by tldraw + database
  // No Zustand store integration
}
```

**Issues**:
1. ❌ All canvas-related props should come from Zustand stores
2. ❌ Canvas state not in Zustand store (only in database)
3. ❌ No way for other components to access canvas state
4. ✅ Auto-save to database works correctly

### **useRenderiqCanvas Hook** (lib/hooks/use-renderiq-canvas.ts)

**Current Implementation**:
```typescript
export function useRenderiqCanvas(options: UseRenderiqCanvasOptions = {}) {
  const { chainId, currentRenderId, autoSave = true } = options;
  
  // Load from database
  const loadCanvasState = async () => {
    if (chainId) {
      result = await loadChainCanvasStateAction(chainId);  // ❌ Only DB, no store
    } else if (currentRenderId) {
      result = await loadCanvasStateAction(currentRenderId);  // ❌ Only DB, no store
    }
    if (snapshot) {
      loadSnapshot(editor.store, snapshot);  // ✅ Loads into tldraw store
    }
  };
  
  // Save to database
  const saveCanvasState = async () => {
    const snapshot = getSnapshot(editor.store);  // ✅ Gets from tldraw store
    await saveChainCanvasStateAction(chainId, canvasState);  // ❌ Only DB, no store
  };
  
  // Auto-save listener
  useEffect(() => {
    const unsubscribe = editor.store.listen(() => {
      // Auto-save to database only
      saveCanvasState();  // ❌ No Zustand store update
    });
  }, [editor, chainId, currentRenderId]);
}
```

**Issues**:
1. ❌ Canvas state only saved to database, not Zustand store
2. ❌ No localStorage persistence
3. ❌ No reactive updates for other components
4. ✅ Database persistence works correctly
5. ✅ Auto-save debouncing works correctly

---

## 🎯 Recommended Improvements

### **1. Create Canvas Store** (NEW)

**File**: `lib/stores/canvas-store.ts`

```typescript
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { logger } from '@/lib/utils/logger';

interface CanvasState {
  // Canvas snapshots by chain/render
  chainSnapshots: Record<string, TLStoreSnapshot>;  // chainId → snapshot
  renderSnapshots: Record<string, TLStoreSnapshot>; // renderId → snapshot
  
  // Current canvas state
  currentChainId: string | null;
  currentRenderId: string | null;
  currentSnapshot: TLStoreSnapshot | null;
  
  // Actions
  setChainSnapshot: (chainId: string, snapshot: TLStoreSnapshot) => void;
  setRenderSnapshot: (renderId: string, snapshot: TLStoreSnapshot) => void;
  setCurrentCanvas: (chainId: string | null, renderId: string | null) => void;
  getChainSnapshot: (chainId: string) => TLStoreSnapshot | null;
  getRenderSnapshot: (renderId: string) => TLStoreSnapshot | null;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      chainSnapshots: {},
      renderSnapshots: {},
      currentChainId: null,
      currentRenderId: null,
      currentSnapshot: null,
      
      setChainSnapshot: (chainId, snapshot) => {
        logger.log('🎨 CanvasStore: Setting chain snapshot', { chainId });
        set((state) => ({
          chainSnapshots: { ...state.chainSnapshots, [chainId]: snapshot },
          currentSnapshot: state.currentChainId === chainId ? snapshot : state.currentSnapshot,
        }));
      },
      
      setRenderSnapshot: (renderId, snapshot) => {
        logger.log('🎨 CanvasStore: Setting render snapshot', { renderId });
        set((state) => ({
          renderSnapshots: { ...state.renderSnapshots, [renderId]: snapshot },
          currentSnapshot: state.currentRenderId === renderId ? snapshot : state.currentSnapshot,
        }));
      },
      
      setCurrentCanvas: (chainId, renderId) => {
        logger.log('🎨 CanvasStore: Setting current canvas', { chainId, renderId });
        const state = get();
        const snapshot = chainId 
          ? state.chainSnapshots[chainId] 
          : renderId 
          ? state.renderSnapshots[renderId] 
          : null;
        set({
          currentChainId: chainId,
          currentRenderId: renderId,
          currentSnapshot: snapshot,
        });
      },
      
      getChainSnapshot: (chainId) => {
        return get().chainSnapshots[chainId] || null;
      },
      
      getRenderSnapshot: (renderId) => {
        return get().renderSnapshots[renderId] || null;
      },
      
      clearCanvas: () => {
        logger.log('🗑️ CanvasStore: Clearing canvas');
        set({
          currentChainId: null,
          currentRenderId: null,
          currentSnapshot: null,
        });
      },
    }),
    {
      name: 'canvas-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist snapshots for offline support
        chainSnapshots: state.chainSnapshots,
        renderSnapshots: state.renderSnapshots,
        currentChainId: state.currentChainId,
        currentRenderId: state.currentRenderId,
      }),
    }
  )
);
```

### **2. Update useRenderiqCanvas Hook**

**File**: `lib/hooks/use-renderiq-canvas.ts`

**Add Zustand store integration**:

```typescript
import { useCanvasStore } from '@/lib/stores/canvas-store';

export function useRenderiqCanvas(options: UseRenderiqCanvasOptions = {}) {
  const { chainId, currentRenderId, autoSave = true } = options;
  
  // ✅ NEW: Get canvas store
  const {
    setChainSnapshot,
    setRenderSnapshot,
    setCurrentCanvas,
    getChainSnapshot,
    getRenderSnapshot,
  } = useCanvasStore();
  
  // ✅ UPDATED: Load from store first, then database
  const loadCanvasState = useCallback(async () => {
    if (!editor) return;
    
    // Priority 1: Load from Zustand store (instant, offline support)
    let snapshot: TLStoreSnapshot | null = null;
    if (chainId) {
      snapshot = getChainSnapshot(chainId);
      if (snapshot) {
        logger.log('✅ useRenderiqCanvas: Loaded from store', { chainId });
        loadSnapshot(editor.store, snapshot);
        return; // Early return - store is source of truth
      }
    } else if (currentRenderId) {
      snapshot = getRenderSnapshot(currentRenderId);
      if (snapshot) {
        logger.log('✅ useRenderiqCanvas: Loaded from store', { currentRenderId });
        loadSnapshot(editor.store, snapshot);
        return;
      }
    }
    
    // Priority 2: Load from database (if not in store)
    setIsLoading(true);
    try {
      let result;
      if (chainId) {
        result = await loadChainCanvasStateAction(chainId);
      } else if (currentRenderId) {
        result = await loadCanvasStateAction(currentRenderId);
      }
      
      if (result?.success && result.data?.canvasData) {
        snapshot = result.data.canvasData as TLStoreSnapshot;
        loadSnapshot(editor.store, snapshot);
        
        // ✅ NEW: Save to Zustand store for next time
        if (chainId) {
          setChainSnapshot(chainId, snapshot);
        } else if (currentRenderId) {
          setRenderSnapshot(currentRenderId, snapshot);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [chainId, currentRenderId, editor, getChainSnapshot, getRenderSnapshot, setChainSnapshot, setRenderSnapshot]);
  
  // ✅ UPDATED: Save to both store and database
  const saveCanvasState = useCallback(async () => {
    if (!editor) return;
    
    const snapshot = getSnapshot(editor.store);
    const snapshotString = JSON.stringify(snapshot);
    
    // Skip if unchanged
    if (snapshotString === lastSavedStateRef.current) return;
    
    setIsSaving(true);
    
    // ✅ NEW: Save to Zustand store first (instant, reactive)
    if (chainId) {
      setChainSnapshot(chainId, snapshot);
    } else if (currentRenderId) {
      setRenderSnapshot(currentRenderId, snapshot);
    }
    
    // ✅ ALSO: Save to database (persistent)
    const canvasState: CanvasState = {
      version: '1.0.0',
      canvasData: snapshot,
    };
    
    const savePromises: Promise<any>[] = [];
    if (chainId) {
      savePromises.push(saveChainCanvasStateAction(chainId, canvasState));
    }
    if (currentRenderId) {
      savePromises.push(saveCanvasStateAction(currentRenderId, canvasState));
    }
    
    await Promise.allSettled(savePromises);
    lastSavedStateRef.current = snapshotString;
    setIsSaving(false);
  }, [chainId, currentRenderId, editor, setChainSnapshot, setRenderSnapshot]);
  
  // ✅ NEW: Update current canvas when chain/render changes
  useEffect(() => {
    setCurrentCanvas(chainId || null, currentRenderId || null);
  }, [chainId, currentRenderId, setCurrentCanvas]);
}
```

### **3. Update unified-chat-interface.tsx**

**Replace prop drilling with store access**:

```typescript
// ✅ BEFORE: Props
export const UnifiedChatInterface = ({ 
  projectId, 
  chainId,  // ❌ Prop
  chain,     // ❌ Prop
  ...
}: UnifiedChatInterfaceProps) => {
  // ❌ Uses props
  <RenderiqCanvas
    currentRender={renderWithLatestData || null}
    chainId={chainId}
    chainRenders={chain?.renders || []}
  />
}

// ✅ AFTER: Stores
export const UnifiedChatInterface = ({ 
  projectId,  // Still needed for API calls
  ... 
}: UnifiedChatInterfaceProps) => {
  // ✅ Get from stores
  const { selectedChainId, chains } = useProjectChainStore();
  const { currentRender, messages } = useChatStore();
  const chain = chains.find(c => c.id === selectedChainId);
  const chainRenders = chain?.renders || [];
  
  // ✅ Use store values
  <RenderiqCanvas
    currentRender={currentRender}
    chainId={selectedChainId}
    chainRenders={chainRenders}
  />
}
```

### **4. Update RenderiqCanvas Component**

**Remove props, use stores**:

```typescript
// ✅ BEFORE: Props
export function RenderiqCanvas({
  currentRender,   // ❌ Prop
  chainId,        // ❌ Prop
  chainRenders,   // ❌ Prop
  ...
}: RenderiqCanvasProps) {
  const { editor } = useRenderiqCanvas({
    chainId,                    // ❌ From prop
    currentRenderId: currentRender?.id,  // ❌ From prop
  });
}

// ✅ AFTER: Stores
export function RenderiqCanvas({
  // Remove currentRender, chainId, chainRenders props
  onRenderAdded,
  isGenerating,
  generatingPrompt,
  ...
}: Omit<RenderiqCanvasProps, 'currentRender' | 'chainId' | 'chainRenders'>) {
  // ✅ Get from stores
  const { selectedChainId, chains } = useProjectChainStore();
  const { currentRender } = useChatStore();
  const chain = chains.find(c => c.id === selectedChainId);
  const chainRenders = chain?.renders || [];
  
  const { editor } = useRenderiqCanvas({
    chainId: selectedChainId,              // ✅ From store
    currentRenderId: currentRender?.id,    // ✅ From store
  });
}
```

---

## 📊 Sync Strategy: tldraw ↔ Zustand ↔ Database

### **Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: tldraw Store (editor.store)                         │
│  - Source of truth for canvas UI                            │
│  - Updated by user interactions                             │
│  - Listened to for changes                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ editor.store.listen()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 2: Zustand Store (useCanvasStore)                      │
│  - Reactive state for React components                      │
│  - localStorage persistence (offline support)              │
│  - Cross-component sharing                                  │
│  - Instant updates (no DB round-trip)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ Auto-save (debounced 2s)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Database (render.contextData.tldrawCanvasState)     │
│  - Persistent storage                                        │
│  - Server-side source of truth                              │
│  - Multi-device sync                                         │
└─────────────────────────────────────────────────────────────┘
```

### **Sync Flow**

1. **User Action** → tldraw store updates
2. **tldraw Listener** → Zustand store updates (instant, reactive)
3. **Zustand Store** → localStorage (persistence)
4. **Debounced Save** → Database (2s delay, persistent)

### **Load Flow**

1. **Component Mount** → Check Zustand store (instant)
2. **If Missing** → Load from database
3. **After Load** → Save to Zustand store + tldraw store

---

## ✅ Benefits of Zustand Integration

### **1. Cross-Component Sharing**
- ✅ Canvas state accessible from any component
- ✅ Sidebar can show canvas selection
- ✅ Navbar can show canvas status
- ✅ Other routes can access canvas state

### **2. localStorage Persistence**
- ✅ Instant restoration on page load
- ✅ Offline support
- ✅ No loading spinner for canvas state
- ✅ Better UX (instant feedback)

### **3. Reactive Updates**
- ✅ Components react to canvas changes
- ✅ Chat messages can reference canvas state
- ✅ Toolbar can sync with canvas selection
- ✅ Real-time UI updates

### **4. Reduced Prop Drilling**
- ✅ No need to pass `chainId`, `currentRender` as props
- ✅ Components access stores directly
- ✅ Cleaner component APIs
- ✅ Better maintainability

---

## 🚨 Current Issues & Risks

### **1. State Inconsistency**
- **Risk**: Canvas state in database may differ from tldraw store
- **Impact**: User sees stale canvas on page reload
- **Mitigation**: Load from database on mount, sync to store

### **2. No Offline Support**
- **Risk**: Canvas state lost if database unavailable
- **Impact**: User loses work if network fails
- **Mitigation**: localStorage persistence via Zustand

### **3. Prop Drilling**
- **Risk**: `chainId`, `currentRender` passed through multiple layers
- **Impact**: Hard to maintain, easy to break
- **Mitigation**: Use stores instead of props

### **4. No Cross-Component Access**
- **Risk**: Other components can't access canvas state
- **Impact**: Can't show canvas selection in sidebar/navbar
- **Mitigation**: Zustand store provides global access

---

## 📝 Implementation Checklist

### **Phase 1: Create Canvas Store**
- [ ] Create `lib/stores/canvas-store.ts`
- [ ] Add TypeScript types for `TLStoreSnapshot`
- [ ] Implement `persist` middleware for localStorage
- [ ] Add actions: `setChainSnapshot`, `setRenderSnapshot`, `setCurrentCanvas`
- [ ] Add selectors: `getChainSnapshot`, `getRenderSnapshot`

### **Phase 2: Update useRenderiqCanvas Hook**
- [ ] Import `useCanvasStore`
- [ ] Update `loadCanvasState` to check store first, then database
- [ ] Update `saveCanvasState` to save to both store and database
- [ ] Add `setCurrentCanvas` call when chain/render changes
- [ ] Test store → database sync

### **Phase 3: Update unified-chat-interface.tsx**
- [ ] Remove `chainId`, `chain`, `currentRender` from props (if possible)
- [ ] Use `useProjectChainStore().selectedChainId` instead of prop
- [ ] Use `useChatStore().currentRender` instead of prop
- [ ] Use `useProjectChainStore().chains` instead of prop
- [ ] Update `RenderiqCanvas` to not receive these props

### **Phase 4: Update RenderiqCanvas Component**
- [ ] Remove `currentRender`, `chainId`, `chainRenders` from props
- [ ] Use `useProjectChainStore()` and `useChatStore()` internally
- [ ] Update component interface to remove these props
- [ ] Test component still works with store values

### **Phase 5: Testing**
- [ ] Test canvas state persists to localStorage
- [ ] Test canvas state loads from store on mount
- [ ] Test canvas state syncs to database
- [ ] Test cross-component access to canvas state
- [ ] Test offline support (localStorage)
- [ ] Test multi-device sync (database)

---

## 🔗 Related Files

### **Stores**
- `lib/stores/canvas-store.ts` (NEW - to be created)
- `lib/stores/project-chain-store.ts` (EXISTS - used for chainId)
- `lib/stores/chat-store.ts` (EXISTS - used for currentRender)

### **Hooks**
- `lib/hooks/use-renderiq-canvas.ts` (EXISTS - needs update)

### **Components**
- `components/chat/unified-chat-interface.tsx` (EXISTS - needs update)
- `components/canvas/renderiq-canvas.tsx` (EXISTS - needs update)

### **Actions**
- `lib/actions/canvas.actions.ts` (EXISTS - no changes needed)

### **Services**
- `lib/services/canvas.service.ts` (EXISTS - no changes needed)

---

## 📚 References

- **tldraw v4 Docs**: https://tldraw.dev/docs
- **tldraw Store API**: https://tldraw.dev/docs/store
- **Signia (tldraw's state)**: https://tldraw.dev/blog/introducing-signia
- **Zustand Docs**: https://zustand-demo.pmnd.rs/
- **Zustand Persist**: https://github.com/pmndrs/zustand#persist-middleware

---

## 🎯 Summary

**Current State**: tldraw canvas state is isolated from Zustand stores, managed only through database persistence.

**Recommended Action**: Create `canvas-store.ts` and integrate it with `useRenderiqCanvas` hook to enable:
1. ✅ Cross-component canvas state sharing
2. ✅ localStorage persistence (offline support)
3. ✅ Reactive updates across components
4. ✅ Reduced prop drilling

**Priority**: **HIGH** - This will significantly improve state management consistency and user experience.

