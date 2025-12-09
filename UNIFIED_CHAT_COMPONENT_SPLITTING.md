# Unified Chat Interface Component Splitting Plan

## Current State

**File**: `components/chat/unified-chat-interface.tsx`
- **Size**: ~4,250 lines
- **Complexity**: Very high - handles all chat functionality in one component
- **Issues**: 
  - Hard to maintain
  - Poor performance (especially on mobile)
  - Difficult to test
  - Large bundle size

## Splitting Strategy

Split into **3 main components** following React 19 and Next.js 16 best practices:

### 1. **ChatInput** Component
**Purpose**: Handle user input, file uploads, and message sending

**Responsibilities**:
- Text input area
- File upload (drag & drop)
- Send button
- Prompt builder/gallery integration
- Settings (style, quality, aspect ratio, etc.)
- Model selection
- Video/image mode toggle

**Props**:
```typescript
interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (message: string, file?: File) => void;
  isGenerating: boolean;
  uploadedFile: File | null;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  settings: SettingsState;
  onSettingsChange: (settings: Partial<SettingsState>) => void;
  credits: number;
  isPro: boolean;
}
```

**Location**: `components/chat/chat-input.tsx`

**Estimated Size**: ~800 lines

---

### 2. **RenderDisplay** Component
**Purpose**: Display renders, handle version navigation, and render actions

**Responsibilities**:
- Main render display (image/video)
- Version carousel/navigation
- Render actions (download, share, upscale, etc.)
- Progress indicator
- Before/after view toggle
- Fullscreen mode
- Render history sidebar

**Props**:
```typescript
interface RenderDisplayProps {
  currentRender: Render | null;
  completedRenders: Render[];
  onRenderSelect: (render: Render) => void;
  onVersionChange: (version: number) => void;
  progress: number;
  isGenerating: boolean;
  onDownload: (render: Render) => void;
  onShare: (render: Render) => void;
  onUpscale: (render: Render) => void;
  beforeAfterView: 'before' | 'after';
  onBeforeAfterChange: (view: 'before' | 'after') => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}
```

**Location**: `components/chat/render-display.tsx`

**Estimated Size**: ~1,200 lines

---

### 3. **MessageList** Component
**Purpose**: Display chat messages and conversation history

**Responsibilities**:
- Message list rendering
- User messages
- Assistant messages (with renders)
- Generating indicators
- Message timestamps
- Scroll to bottom
- Message actions (copy, regenerate, etc.)

**Props**:
```typescript
interface MessageListProps {
  messages: Message[];
  currentRender: Render | null;
  onRenderSelect: (render: Render) => void;
  isGenerating: boolean;
  progress: number;
}
```

**Location**: `components/chat/message-list.tsx`

**Estimated Size**: ~600 lines

---

## Main Container Component

**UnifiedChatInterface** becomes a **container component** that:
- Manages state (using existing reducers)
- Coordinates between child components
- Handles data fetching and polling
- Manages modals and dialogs

**Estimated Size**: ~1,500 lines (down from 4,250)

---

## Shared Utilities & Hooks

Extract to separate files:

### Hooks
- `use-chat-state.ts` - Chat state reducer
- `use-settings-state.ts` - Settings reducer
- `use-render-polling.ts` - Polling logic
- `use-render-recovery.ts` - Network recovery

### Utilities
- `render-helpers.ts` - Render manipulation utilities
- `message-helpers.ts` - Message conversion utilities
- `chat-constants.ts` - Already exists

---

## Implementation Steps

### Phase 1: Extract ChatInput (Week 1)
1. Create `components/chat/chat-input.tsx`
2. Move input-related code from unified-chat-interface
3. Extract settings management
4. Test in isolation
5. Integrate back into main component

### Phase 2: Extract RenderDisplay (Week 1-2)
1. Create `components/chat/render-display.tsx`
2. Move render display code
3. Extract version navigation
4. Extract render actions
5. Test in isolation
6. Integrate back into main component

### Phase 3: Extract MessageList (Week 2)
1. Create `components/chat/message-list.tsx`
2. Move message rendering code
3. Extract message components
4. Test in isolation
5. Integrate back into main component

### Phase 4: Refactor Main Component (Week 2-3)
1. Simplify UnifiedChatInterface to container
2. Extract shared hooks
3. Extract shared utilities
4. Optimize state management
5. Add error boundaries
6. Performance testing

### Phase 5: Testing & Optimization (Week 3)
1. Unit tests for each component
2. Integration tests
3. Performance profiling
4. Mobile optimization
5. Bundle size optimization

---

## Benefits

### Performance
- **Code splitting**: Each component can be lazy loaded
- **Smaller bundles**: Only load what's needed
- **Better memoization**: Smaller components = better React.memo
- **Faster initial load**: Main component is much smaller

### Maintainability
- **Easier to understand**: Each component has single responsibility
- **Easier to test**: Test components in isolation
- **Easier to debug**: Smaller surface area for bugs
- **Easier to modify**: Changes are localized

### Developer Experience
- **Better IDE performance**: Smaller files = faster parsing
- **Easier code review**: Smaller PRs
- **Better collaboration**: Multiple devs can work on different components
- **Easier onboarding**: New devs can understand one component at a time

---

## Migration Strategy

### Backward Compatibility
- Keep UnifiedChatInterface API the same
- Internal refactoring only
- No breaking changes for consumers

### Gradual Migration
- Extract components one at a time
- Test thoroughly after each extraction
- Keep main component working throughout

### Rollback Plan
- Each phase is independent
- Can rollback individual components
- Main component remains functional

---

## File Structure

```
components/chat/
├── unified-chat-interface.tsx (container, ~1,500 lines)
├── chat-input.tsx (~800 lines)
├── render-display.tsx (~1,200 lines)
├── message-list.tsx (~600 lines)
├── hooks/
│   ├── use-chat-state.ts
│   ├── use-settings-state.ts
│   ├── use-render-polling.ts
│   └── use-render-recovery.ts
├── utils/
│   ├── render-helpers.ts
│   └── message-helpers.ts
└── types/
    └── chat-types.ts
```

---

## Success Metrics

- **Bundle size**: Reduce by 30-40%
- **Initial load time**: Improve by 20-30%
- **Mobile performance**: 60 FPS scrolling
- **Code maintainability**: Reduce complexity by 50%
- **Test coverage**: 80%+ for each component

---

## Notes

- Follow React 19 best practices (useReducer, useMemo, useCallback)
- Use Next.js 16 features (server components where possible)
- Maintain TypeScript strict mode
- Keep accessibility (a11y) in mind
- Mobile-first approach
- Performance monitoring in production

