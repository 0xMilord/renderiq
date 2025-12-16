# Agent Kit & Unified Chat Interface Integration Audit

**Date**: 2025-01-XX  
**Status**: Critical Issues Found  
**Goal**: Audit agent-kit integration, state management sync, and message refresh issues

---

## Executive Summary

The agent-kit (@/agent-kit) is integrated with the unified chat interface, but there are **critical synchronization issues** causing messages to not appear without page refresh. The infrastructure has three separate agents that need orchestration:

1. **Tldraw Canvas Agent** - Handles canvas manipulation tasks
2. **Image Generation Agent** - Handles image/video generation (via routing)
3. **Orchestrator Bot** - Should coordinate between agents (currently missing)

### Critical Issues Found

1. ❌ **Messages don't appear without refresh** - Agent messages saved to DB aren't loaded on mount
2. ❌ **State sync gap** - Signia (agent-kit) and Zustand (chat-store) aren't fully synchronized
3. ⚠️ **Missing orchestrator** - No clear coordination between Tldraw agent and image generation
4. ⚠️ **Database messages not loaded** - Unified chat only loads from `chain.renders`, not `chat_messages` table

---

## Architecture Overview

### Current Integration Points

#### 1. Agent-Kit Integration (`@/agent-kit`)

**Location**: `agent-kit/` directory

**Key Components**:
- `client/agent/TldrawAgent.ts` - Main agent class with Signia atoms
- `client/components/ChatInput.tsx` - Original agent chat input
- `worker/do/AgentService.ts` - Backend service (Gemini-only)
- `shared/actions/` - Canvas action utilities
- `shared/parts/` - Prompt part utilities

**State Management**: Uses **Signia** (tldraw's reactive state)
- `$chatHistory` - Atom containing chat history
- `$todoList` - Atom containing todo items
- `$contextItems` - Atom containing context items
- Persisted to localStorage by agent-kit

#### 2. Unified Chat Interface

**Location**: `components/chat/unified-chat-interface.tsx`

**State Management**: Uses **Zustand** (`lib/stores/chat-store.ts`)
- `messages` - Array of Message objects
- `currentRender` - Current render being displayed
- Persisted to localStorage

**Message Sources**:
1. `chain.renders` - Converted to messages via `convertRendersToMessages()`
2. Local state (during generation)
3. localStorage (via `useLocalStorageMessages` hook)
4. ❌ **NOT loading from `chat_messages` table**

#### 3. Agent Hook Integration

**Location**: `lib/hooks/use-renderiq-agent.ts`

**Functionality**:
- Creates `TldrawAgent` instance
- Syncs agent chat history to chat-store using Signia `react()`
- Saves agent messages to database via `/api/chat/messages`

**Sync Mechanism** (lines 91-225):
```typescript
// Subscribe to agent chat history changes using Signia react()
const unsubscribe = react('sync-agent-chat-history-renderiq', () => {
  const history = agent.$chatHistory.get();
  // Map new items to chat store messages
  // Save to database
});
```

**Problem**: This only syncs NEW items, not existing ones on mount.

---

## Critical Issues

### Issue #1: Messages Don't Appear Without Page Refresh

**Root Cause**: Agent messages are saved to database but never loaded on mount.

**Flow**:
1. User sends agent message → Saved to DB via `use-renderiq-agent.ts` (line 131)
2. Agent processes → Updates Signia `$chatHistory` atom
3. Signia `react()` syncs to chat-store (line 99-225)
4. **On page refresh**: 
   - Agent's Signia atom restores from localStorage (agent-kit persistence)
   - Signia `react()` syncs to chat-store
   - ✅ Messages appear
5. **On initial load (no refresh)**:
   - Agent's Signia atom is empty (no localStorage yet)
   - No sync happens
   - ❌ Messages don't appear

**Evidence**:
- `unified-chat-interface.tsx` line 704-707: Only loads from `chain.renders`
- `unified-chat-interface.tsx` line 729: Only restores from localStorage
- No code loads from `/api/chat/messages` GET endpoint

**Fix Required**:
- Load agent messages from `/api/chat/messages?chainId=X&projectId=Y` on mount
- Merge with render messages from `chain.renders`
- Ensure proper ordering by timestamp/position

### Issue #2: State Management Sync Gap

**Problem**: Two separate state systems that don't fully sync:

1. **Signia Atoms** (agent-kit):
   - `agent.$chatHistory` - Agent chat history
   - Persisted to localStorage by agent-kit
   - Reactive via `react()`

2. **Zustand Store** (chat-store):
   - `messages` - Unified chat messages
   - Persisted to localStorage separately
   - Used by unified chat interface

**Current Sync**:
- ✅ Agent → Chat Store: Works via Signia `react()` (one-way, new items only)
- ❌ Chat Store → Agent: Missing (agent doesn't know about render messages)
- ❌ Database → Chat Store: Missing (agent messages not loaded)

**Fix Required**:
- Load messages from DB on mount
- Sync both directions (agent ↔ chat-store)
- Ensure single source of truth (database)

### Issue #3: Missing Orchestrator Pattern

**Current State**:
- ✅ Routing logic exists (`lib/utils/agent-routing.ts`)
- ✅ Tldraw agent exists (`TldrawAgent`)
- ✅ Image generation exists (via `useImageGeneration`)
- ❌ No orchestrator bot to coordinate

**What's Needed**:
1. **Orchestrator Bot** - Simple bot that:
   - Talks to user in unified chat
   - Routes to Tldraw agent for canvas tasks
   - Routes to image generation for renders
   - Coordinates hybrid workflows

2. **Current Routing** (lines 1802-1904):
   - `analyzeRouting()` determines mode
   - Direct calls to `agent.prompt()` or image generation
   - No orchestrator layer

**Fix Required**:
- Create orchestrator service/component
- Route all user messages through orchestrator
- Orchestrator decides which agent(s) to call
- Orchestrator coordinates multi-agent workflows

### Issue #4: Database Messages Not Loaded

**Problem**: The unified chat interface only loads messages from `chain.renders`, not from the `chat_messages` table.

**Current Flow**:
1. Messages saved to DB via `/api/chat/messages` POST
2. Messages stored in `chat_messages` table with `messageType` ('render' | 'agent')
3. On mount, unified chat only loads from `chain.renders`
4. Agent messages in DB are ignored

**Evidence**:
- `unified-chat-interface.tsx` line 704: `const chainMessages = useMemo(() => convertRendersToMessages(chain.renders))`
- No fetch to `/api/chat/messages` GET endpoint
- `app/api/chat/messages/route.ts` has GET handler but it's unused

**Fix Required**:
- Load messages from `/api/chat/messages?chainId=X&projectId=Y` on mount
- Merge with render messages
- Sort by timestamp/position
- Display both render and agent messages in unified interface

---

## Agent Alignment Analysis

### Tldraw Canvas Agent

**Status**: ✅ Integrated

**Location**: 
- `agent-kit/client/agent/TldrawAgent.ts`
- `lib/hooks/use-renderiq-agent.ts`

**Capabilities**:
- Canvas manipulation (create, move, resize, delete shapes)
- Todo list management
- Context item selection
- Chat history with actions

**Integration Points**:
- ✅ Created via `useRenderiqAgent` hook
- ✅ Synced to chat-store via Signia `react()`
- ✅ Saved to database
- ❌ Not loaded from database on mount

### Image Generation Agent

**Status**: ⚠️ Not a separate agent, handled via routing

**Location**: 
- `lib/hooks/use-ai-sdk.ts` - `useImageGeneration()`
- `components/chat/unified-chat-interface.tsx` - Direct calls

**Capabilities**:
- Image generation via Google Gemini
- Video generation via Google Veo
- Quality/aspect ratio controls

**Integration Points**:
- ✅ Routed via `analyzeRouting()`
- ✅ Messages saved to database
- ✅ Messages loaded from `chain.renders`
- ⚠️ Not a true "agent" - just a service

**Recommendation**: Consider creating a proper `ImageGenerationAgent` class similar to `TldrawAgent` for consistency.

### Orchestrator Bot

**Status**: ❌ Missing

**What's Needed**:
- Simple bot that talks to user
- Routes messages to appropriate agent(s)
- Coordinates multi-agent workflows
- Maintains conversation context

**Current Workaround**:
- Routing logic in `unified-chat-interface.tsx` (lines 1802-1904)
- Direct calls to agents/services
- No coordination layer

**Recommendation**: Create `OrchestratorAgent` class that:
1. Receives all user messages
2. Analyzes intent via `analyzeRouting()`
3. Routes to Tldraw agent, image generation, or both
4. Coordinates responses
5. Maintains unified conversation history

---

## State Management Deep Dive

### Signia (Agent-Kit)

**Location**: `agent-kit/client/agent/TldrawAgent.ts`

**Atoms**:
- `$chatHistory` - Chat history items
- `$todoList` - Todo items
- `$contextItems` - Context items
- `$modelName` - Selected model

**Persistence**:
- Persisted to localStorage by agent-kit (line 131-134)
- Keys: `${id}:chat-history`, `${id}:todo-items`, etc.

**Reactivity**:
- Uses `react()` from tldraw for reactive updates
- `useValue()` hook for React components

### Zustand (Chat Store)

**Location**: `lib/stores/chat-store.ts`

**State**:
- `messages` - Array of Message objects
- `currentRender` - Current render
- `isGenerating` - Generation state

**Persistence**:
- Persisted to localStorage via Zustand persist middleware
- Key: `chat-store-${projectId}-${chainId}`

**Sync with Signia**:
- One-way: Agent → Chat Store (via `use-renderiq-agent.ts`)
- Missing: Chat Store → Agent
- Missing: Database → Chat Store

### Sync Flow Analysis

**Current Flow** (Agent → Chat Store):
```
User sends message
  → Agent processes
  → Updates agent.$chatHistory (Signia atom)
  → Signia react() triggers
  → Maps to chat-store messages
  → Updates chat-store.messages (Zustand)
  → Saves to database
```

**Missing Flow** (Database → Chat Store):
```
Page loads
  → Should fetch from /api/chat/messages
  → Should merge with chain.renders messages
  → Should update chat-store.messages
  → Should restore agent.$chatHistory from DB
```

**Missing Flow** (Chat Store → Agent):
```
Render message added to chat-store
  → Should notify agent (if relevant)
  → Should update agent context
```

---

## Recommendations

### Priority 1: Fix Message Loading

**Action**: Load messages from database on mount

**Files to Modify**:
1. `components/chat/unified-chat-interface.tsx`
   - Add `useEffect` to fetch from `/api/chat/messages` on mount
   - Merge with `chain.renders` messages
   - Sort by timestamp/position

2. `lib/hooks/use-renderiq-agent.ts`
   - Add function to load agent messages from DB
   - Restore agent `$chatHistory` from DB on mount

**Implementation**:
```typescript
// In unified-chat-interface.tsx
useEffect(() => {
  if (!chainId || !projectId) return;
  
  // Load messages from database
  fetch(`/api/chat/messages?chainId=${chainId}&projectId=${projectId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Convert DB messages to Message format
        const dbMessages = data.messages.map(convertDbMessageToMessage);
        // Merge with chain.renders messages
        const allMessages = mergeMessages(dbMessages, chainMessages);
        setMessages(allMessages);
      }
    });
}, [chainId, projectId]);
```

### Priority 2: Create Orchestrator

**Action**: Create orchestrator bot to coordinate agents

**Files to Create**:
1. `lib/agents/orchestrator-agent.ts` - Orchestrator class
2. `lib/hooks/use-orchestrator.ts` - Orchestrator hook

**Implementation**:
```typescript
class OrchestratorAgent {
  async handleMessage(message: string) {
    const routing = analyzeRouting(message);
    
    if (routing.mode === 'agent') {
      return await this.tldrawAgent.prompt(message);
    } else if (routing.mode === 'image-gen') {
      return await this.imageGenService.generate(message);
    } else if (routing.mode === 'hybrid') {
      // Coordinate both
      const [agentResult, imageResult] = await Promise.all([
        this.tldrawAgent.prompt(routing.agentPrompt),
        this.imageGenService.generate(routing.imageGenPrompt)
      ]);
      return { agentResult, imageResult };
    }
  }
}
```

### Priority 3: Improve State Sync

**Action**: Ensure bidirectional sync between Signia and Zustand

**Files to Modify**:
1. `lib/hooks/use-renderiq-agent.ts`
   - Add function to sync chat-store messages to agent
   - Load agent history from DB on mount

2. `lib/stores/chat-store.ts`
   - Add middleware to notify agent when messages change

### Priority 4: Unify Agent Architecture

**Action**: Create consistent agent pattern for image generation

**Files to Create**:
1. `lib/agents/image-generation-agent.ts` - Image generation agent class

**Benefits**:
- Consistent API with TldrawAgent
- Better state management
- Easier orchestration

---

## Testing Checklist

- [ ] Agent messages appear on page load (without refresh)
- [ ] Agent messages persist across page refreshes
- [ ] Render messages and agent messages are merged correctly
- [ ] Message ordering is correct (by timestamp/position)
- [ ] Orchestrator routes messages correctly
- [ ] Hybrid mode (agent + image gen) works
- [ ] State sync works in both directions
- [ ] Database is single source of truth
- [ ] localStorage is used only for caching

---

## Files Summary

### Key Files

1. **Agent-Kit Integration**:
   - `agent-kit/client/agent/TldrawAgent.ts` - Main agent class
   - `lib/hooks/use-renderiq-agent.ts` - Agent hook with sync logic

2. **Unified Chat Interface**:
   - `components/chat/unified-chat-interface.tsx` - Main chat component
   - `lib/stores/chat-store.ts` - Zustand store

3. **Routing**:
   - `lib/utils/agent-routing.ts` - Routing logic

4. **Database**:
   - `app/api/chat/messages/route.ts` - Message API (GET/POST)
   - `lib/utils/save-chat-message.ts` - Save helper

5. **Agent Components**:
   - `components/agent/RenderiqChatHistory.tsx` - Agent chat history display
   - `components/agent/RenderiqChatInput.tsx` - Agent chat input (legacy)

---

## Next Steps

1. **Immediate**: Fix message loading from database
2. **Short-term**: Create orchestrator bot
3. **Medium-term**: Improve state sync
4. **Long-term**: Unify agent architecture

---

## Conclusion

The agent-kit is integrated but has critical synchronization issues. The main problems are:

1. Messages not loaded from database on mount
2. State sync gaps between Signia and Zustand
3. Missing orchestrator to coordinate agents
4. Inconsistent agent architecture

Fixing these issues will ensure both worlds (agent-kit and unified chat) live in sync, with proper message persistence and state management.

