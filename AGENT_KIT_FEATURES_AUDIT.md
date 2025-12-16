# Agent-Kit Features Audit Report
**Date**: 2025-12-16  
**Status**: Comprehensive Feature Gap Analysis  
**Goal**: Identify all agent-kit features not yet integrated into unified chat interface

---

## Executive Summary

This audit compares the full feature set of `agent-kit/` with what's currently implemented in `components/chat/unified-chat-interface.tsx`. The goal is to identify gaps and missing functionality.

**Key Findings**:
- ✅ **Integrated**: Basic agent prompting, context tools, model selection, todo list, chat history
- ❌ **Missing**: Diff viewer, accept/reject actions, visual highlights, GoToAgent button, advanced action types
- ⚠️ **Partial**: Chat history (basic version exists, but missing diff visualization)

---

## 1. UI Components Audit

### ✅ Integrated Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `RenderiqChatHistory` | `components/agent/RenderiqChatHistory.tsx` | ✅ Integrated | Basic chat history display |
| `RenderiqTodoList` | `components/agent/RenderiqTodoList.tsx` | ✅ Integrated | Todo list with status badges |
| `RenderiqContextItemTag` | `components/agent/RenderiqContextItemTag.tsx` | ✅ Integrated | Context item removal tags |
| `RenderiqSelectionTag` | `components/agent/RenderiqSelectionTag.tsx` | ✅ Integrated | Selected shapes tag |

### ❌ Missing Components

| Component | Location | Purpose | Priority |
|-----------|----------|---------|----------|
| `ContextHighlights` | `agent-kit/client/components/highlights/ContextHighlights.tsx` | Visual highlights for context items (areas, shapes, points) on canvas | 🔴 High |
| `GoToAgentButton` | `agent-kit/client/components/GoToAgentButton.tsx` | Button to navigate to agent's viewport when offscreen | 🟡 Medium |
| `CustomHelperButtons` | `agent-kit/client/components/CustomHelperButtons.tsx` | Custom helper buttons in tldraw UI | 🟡 Medium |
| `TldrawDiffViewer` | `agent-kit/client/components/chat-history/TldrawDiffViewer.tsx` | Visual diff viewer for canvas changes | 🔴 High |
| `TldrawViewer` | `agent-kit/client/components/chat-history/TldrawViewer.tsx` | Canvas viewer component | 🟡 Medium |
| `ChatHistoryGroupWithDiff` | `agent-kit/client/components/chat-history/ChatHistoryGroupWithDiff.tsx` | Chat history with accept/reject actions | 🔴 High |
| `ChatHistoryGroupWithoutDiff` | `agent-kit/client/components/chat-history/ChatHistoryGroupWithoutDiff.tsx` | Chat history without diff (fallback) | ✅ Used internally |
| `ChatHistorySection` | `agent-kit/client/components/chat-history/ChatHistorySection.tsx` | Section grouping for chat history | ✅ Used internally |
| `ChatHistoryPrompt` | `agent-kit/client/components/chat-history/ChatHistoryPrompt.tsx` | Prompt display in chat history | ✅ Used internally |

---

## 2. Agent Actions Audit

### ✅ Available Actions (from `agent-kit/shared/actions/`)

All actions are available through the agent service, but UI integration varies:

| Action | File | UI Integration | Notes |
|--------|------|----------------|-------|
| `MessageAction` | `MessageActionUtil.ts` | ✅ Basic | Messages shown in chat history |
| `ThinkAction` | `ThinkActionUtil.ts` | ✅ Basic | Thinking shown in chat history |
| `ReviewAction` | `ReviewActionUtil.ts` | ⚠️ Partial | Review scheduling works, but review UI not prominent |
| `AddDetailAction` | `AddDetailActionUtil.ts` | ✅ Basic | Shown in chat history |
| `TodoListAction` | `TodoListActionUtil.ts` | ✅ Integrated | Todo list fully integrated |
| `SetMyViewAction` | `SetMyViewActionUtil.ts` | ⚠️ Partial | Viewport changes work, but no GoToAgent button |
| `CreateAction` | `CreateActionUtil.ts` | ✅ Basic | Shape creation shown in chat history |
| `DeleteAction` | `DeleteActionUtil.ts` | ✅ Basic | Deletion shown in chat history |
| `UpdateAction` | `UpdateActionUtil.ts` | ✅ Basic | Updates shown in chat history |
| `LabelAction` | `LabelActionUtil.ts` | ✅ Basic | Labels shown in chat history |
| `MoveAction` | `MoveActionUtil.ts` | ✅ Basic | Movement shown in chat history |
| `PlaceAction` | `PlaceActionUtil.ts` | ✅ Basic | Placement shown in chat history |
| `BringToFrontAction` | `BringToFrontActionUtil.ts` | ✅ Basic | Z-order changes shown in chat history |
| `SendToBackAction` | `SendToBackActionUtil.ts` | ✅ Basic | Z-order changes shown in chat history |
| `RotateAction` | `RotateActionUtil.ts` | ✅ Basic | Rotation shown in chat history |
| `ResizeAction` | `ResizeActionUtil.ts` | ✅ Basic | Resize shown in chat history |
| `AlignAction` | `AlignActionUtil.ts` | ✅ Basic | Alignment shown in chat history |
| `DistributeAction` | `DistributeActionUtil.ts` | ✅ Basic | Distribution shown in chat history |
| `StackAction` | `StackActionUtil.ts` | ✅ Basic | Stacking shown in chat history |
| `ClearAction` | `ClearActionUtil.ts` | ✅ Basic | Clear shown in chat history |
| `PenAction` | `PenActionUtil.ts` | ✅ Basic | Pen strokes shown in chat history |
| `RandomWikipediaArticleAction` | `RandomWikipediaArticleActionUtil.ts` | ✅ Basic | External API integration works |
| `CountryInfoAction` | `CountryInfoActionUtil.ts` | ✅ Basic | External API integration works |
| `CountShapesAction` | `CountShapesActionUtil.ts` | ✅ Basic | Counting shown in chat history |

**Key Gap**: All actions work, but **diff visualization and accept/reject functionality is missing**.

---

## 3. Prompt Parts Audit

### ✅ Available Prompt Parts (from `agent-kit/shared/parts/`)

All prompt parts are automatically included in agent requests:

| Prompt Part | File | Purpose | Status |
|-------------|------|---------|--------|
| `SystemPromptPart` | `SystemPromptPartUtil.ts` | System instructions for agent | ✅ Active |
| `ModelNamePart` | `ModelNamePartUtil.ts` | Model selection | ✅ Active |
| `MessagesPart` | `MessagesPartUtil.ts` | Chat history messages | ✅ Active |
| `DataPart` | `DataPartUtil.ts` | Additional data (e.g., from APIs) | ✅ Active |
| `ContextItemsPart` | `ContextItemsPartUtil.ts` | Selected context items | ✅ Active |
| `ScreenshotPart` | `ScreenshotPartUtil.ts` | Canvas screenshot | ✅ Active |
| `ViewportBoundsPart` | `ViewportBoundsPartUtil.ts` | Viewport bounds | ✅ Active |
| `BlurryShapesPart` | `BlurryShapesPartUtil.ts` | Shapes in viewport (simplified) | ✅ Active |
| `PeripheralShapesPart` | `PeripheralShapesPartUtil.ts` | Shapes outside viewport (clustered) | ✅ Active |
| `SelectedShapesPart` | `SelectedShapesPartUtil.ts` | Currently selected shapes | ✅ Active |
| `ChatHistoryPart` | `ChatHistoryPartUtil.ts` | Previous chat history | ✅ Active |
| `UserActionHistoryPart` | `UserActionHistoryPartUtil.ts` | User's recent actions | ✅ Active |
| `TodoListPart` | `TodoListPartUtil.ts` | Agent's todo list | ✅ Active |
| `TimePart` | `TimePartUtil.ts` | Current time | ✅ Active |

**Status**: All prompt parts are active and working. No gaps here.

---

## 4. Visual Features Audit

### ❌ Missing Visual Features

| Feature | Component | Priority | Description |
|---------|-----------|----------|-------------|
| **Context Highlights** | `ContextHighlights.tsx` | 🔴 High | Visual highlights on canvas for selected context items (areas, shapes, points) |
| **Diff Visualization** | `TldrawDiffViewer.tsx` | 🔴 High | Visual diff showing what changed on canvas (before/after) |
| **Accept/Reject Actions** | `ChatHistoryGroupWithDiff.tsx` | 🔴 High | UI to accept or reject agent's canvas changes |
| **GoToAgent Button** | `GoToAgentButton.tsx` | 🟡 Medium | Button to navigate to agent's viewport when it's offscreen |
| **Agent Viewport Highlights** | `AgentViewportBoundsHighlights.tsx` | 🟡 Medium | Visual indicator of agent's current viewport bounds |
| **Area Highlights** | `AreaHighlight.tsx` | 🔴 High | Highlighted areas on canvas (used by ContextHighlights) |
| **Point Highlights** | `PointHighlight.tsx` | 🔴 High | Highlighted points on canvas (used by ContextHighlights) |

---

## 5. Chat History Features Audit

### ✅ Current Implementation

- Basic chat history display (`RenderiqChatHistory`)
- Shows prompts and actions
- Groups actions by prompt
- Displays action icons and descriptions

### ❌ Missing Features

| Feature | Component | Description |
|---------|-----------|-------------|
| **Diff Viewer** | `TldrawDiffViewer` | Visual representation of canvas changes |
| **Accept/Reject Buttons** | `ChatHistoryGroupWithDiff` | Accept or reject agent's changes |
| **Action Grouping with Diff** | `ChatHistoryGroupWithDiff` | Group actions that have canvas diffs |
| **Diff Steps Display** | `DiffSteps` | Show step-by-step what changed |
| **Action Collapsibility** | `ChatHistoryGroup` | Collapse/expand action groups |
| **Action Info Display** | `getActionInfo` | Rich action information (icons, descriptions) |

---

## 6. Agent State Management Audit

### ✅ Available State (from `TldrawAgent`)

| State Atom | Purpose | Integration Status |
|------------|---------|-------------------|
| `$activeRequest` | Current active request | ⚠️ Partial (not displayed in UI) |
| `$scheduledRequest` | Next scheduled request | ❌ Not displayed |
| `$chatHistory` | Chat history items | ✅ Integrated |
| `$chatOrigin` | Chat starting position | ❌ Not used |
| `$todoList` | Todo items | ✅ Integrated |
| `$userActionHistory` | User's recent actions | ✅ Used internally |
| `$contextItems` | Selected context items | ✅ Integrated |
| `$modelName` | Selected model | ✅ Integrated |

**Gaps**:
- `$activeRequest` and `$scheduledRequest` are not displayed in UI
- `$chatOrigin` is not used for any visual features

---

## 7. Integration Points Audit

### ✅ Current Integration

1. **Agent Creation**: `useRenderiqAgent` hook creates agent
2. **Agent Storage**: Agent stored in `useCanvasStore`
3. **Prompting**: Agent can be prompted via `agent.prompt()`
4. **Smart Routing**: `analyzeRouting` routes between agent and image gen
5. **Context Tools**: Context selection tools integrated in unified input
6. **Model Selection**: Agent model selection integrated

### ❌ Missing Integration Points

1. **Canvas Highlights**: No integration of `ContextHighlights` component
2. **Diff Visualization**: No integration of diff viewer
3. **Accept/Reject UI**: No UI for accepting/rejecting changes
4. **GoToAgent Button**: No button to navigate to agent viewport
5. **Agent Viewport Display**: No visual indicator of agent's viewport
6. **Action Acceptance State**: No tracking of accepted/rejected actions

---

## 8. Priority Recommendations

### 🔴 High Priority (Critical for UX)

1. **Add Context Highlights** (`ContextHighlights.tsx`)
   - Visual feedback for selected context items
   - Shows areas, shapes, and points on canvas
   - Improves user understanding of what agent is working with

2. **Add Diff Viewer** (`TldrawDiffViewer.tsx`)
   - Visual representation of canvas changes
   - Before/after comparison
   - Essential for understanding agent's work

3. **Add Accept/Reject Actions** (`ChatHistoryGroupWithDiff.tsx`)
   - Allow users to accept or reject agent's changes
   - Critical for user control over agent actions
   - Prevents unwanted changes from persisting

### 🟡 Medium Priority (Nice to Have)

4. **Add GoToAgent Button** (`GoToAgentButton.tsx`)
   - Navigate to agent's viewport when offscreen
   - Improves UX when agent is working in different area

5. **Display Active/Scheduled Requests**
   - Show current active request status
   - Show scheduled request preview
   - Better visibility into agent's state

6. **Add Agent Viewport Highlights**
   - Visual indicator of agent's current viewport
   - Helps user understand what agent can see

### 🟢 Low Priority (Future Enhancements)

7. **Enhanced Action Grouping**
   - Better collapsibility
   - More detailed action info
   - Action filtering/search

8. **Chat Origin Visualization**
   - Show where chat started on canvas
   - Visual reference point

---

## 9. Implementation Notes

### Context Highlights Integration

To add context highlights, integrate `ContextHighlights` component in the canvas component:

```tsx
// In renderiq-canvas.tsx or similar
import { ContextHighlights } from '@/agent-kit/client/components/highlights/ContextHighlights';

{agent && <ContextHighlights agent={agent} />}
```

### Diff Viewer Integration

To add diff viewer, enhance `RenderiqChatHistory` to use `ChatHistoryGroupWithDiff`:

```tsx
// Enhance RenderiqChatHistory to show diffs
import { ChatHistoryGroupWithDiff } from '@/agent-kit/client/components/chat-history/ChatHistoryGroupWithDiff';
```

### Accept/Reject Integration

The accept/reject functionality is already built into `ChatHistoryGroupWithDiff`. Just need to ensure it's used instead of basic history display.

---

## 10. Summary

**Total Features Audited**: 50+  
**✅ Integrated**: ~30  
**❌ Missing**: ~20  
**⚠️ Partial**: ~5

**Key Gaps**:
1. Visual feedback (highlights, diffs)
2. User control (accept/reject)
3. Navigation (GoToAgent button)
4. State visibility (active/scheduled requests)

**Next Steps**:
1. Integrate `ContextHighlights` for visual feedback
2. Add diff viewer to chat history
3. Implement accept/reject UI
4. Add GoToAgent button for navigation

---

## Appendix: File Structure Reference

```
agent-kit/
├── client/
│   ├── components/
│   │   ├── highlights/          ❌ Not integrated
│   │   │   ├── ContextHighlights.tsx
│   │   │   ├── AreaHighlight.tsx
│   │   │   └── PointHighlight.tsx
│   │   ├── chat-history/        ⚠️ Partially integrated
│   │   │   ├── ChatHistory.tsx  ✅ Used
│   │   │   ├── ChatHistoryGroupWithDiff.tsx  ❌ Not used
│   │   │   ├── TldrawDiffViewer.tsx  ❌ Not used
│   │   │   └── TldrawViewer.tsx  ❌ Not used
│   │   ├── GoToAgentButton.tsx  ❌ Not integrated
│   │   └── CustomHelperButtons.tsx  ❌ Not integrated
│   └── agent/
│       └── TldrawAgent.ts  ✅ Used
├── shared/
│   ├── actions/  ✅ All actions available
│   └── parts/  ✅ All parts active
└── worker/
    └── do/
        └── AgentService.ts  ✅ Used
```

---

**Report Generated**: 2025-12-16  
**Next Review**: After implementing high-priority features

