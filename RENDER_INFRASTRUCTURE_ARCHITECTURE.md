# Render Infrastructure Architecture

**Date**: 2025-01-27  
**Status**: Complete Architecture Documentation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Flow](#architecture-flow)
3. [API Routes](#api-routes)
4. [Services Layer](#services-layer)
5. [Data Access Layer (DAL)](#data-access-layer-dal)
6. [Hooks & Client Utilities](#hooks--client-utilities)
7. [Server Actions](#server-actions)
8. [Utils & Helpers](#utils--helpers)
9. [Complete Request Flow](#complete-request-flow)

---

## 🎯 Overview

The Render Infrastructure is a comprehensive system for generating AI images and videos. It consists of:

- **API Routes**: HTTP endpoints for render requests
- **Services**: Business logic and orchestration
- **DAL (Data Access Layer)**: Database operations
- **Hooks**: React hooks for client-side usage
- **Server Actions**: Server-side form handlers
- **Utils**: Helper functions and utilities

---

## 🔄 Architecture Flow

```
User Request
    ↓
API Route (/api/renders)
    ↓
Authentication & Validation
    ↓
Service Orchestration (RenderPipeline / RenderService)
    ↓
AI Generation (AISDKService)
    ↓
Storage (StorageService)
    ↓
Database (DAL)
    ↓
Response
```

---

## 🌐 API Routes

### **Main Render API**

**File**: `app/api/renders/route.ts`

**Function**: `handleRenderRequest(request: NextRequest)`

**Responsibilities**:
- ✅ Authentication (Bearer token or cookie-based)
- ✅ Rate limiting
- ✅ Request validation (size, format, security)
- ✅ Credit deduction
- ✅ Render orchestration
- ✅ Error handling
- ✅ CORS handling
- ✅ Sentry tracking

**Key Features**:
- Supports both image and video generation
- Handles FormData with image uploads
- Integrates full Technical Moat Pipeline (optional)
- Supports prompt refinement for tool-generated prompts
- Multi-turn chat API support (fallback)
- Batch rendering support
- Project rules integration

**Query Parameters**:
- `?fullPipeline=true` - Enable full 7-stage pipeline
- `?refinePrompt=true` - Enable prompt refinement
- `?batch=true` - Enable batch rendering

---

### **Other Render-Related APIs**

#### **Image Inpainting API**
**File**: `app/api/renders/inpaint/route.ts`
- Mask-based inpainting
- Canvas mask tool support

#### **Video API**
**File**: `app/api/video/route.ts`
- Video generation with Veo 3.1
- Keyframe sequences
- Video extension

#### **AI Generation APIs**
**Files**: `app/api/ai/*/route.ts`
- `/api/ai/generate-image` - Direct image generation
- `/api/ai/generate-video` - Direct video generation
- `/api/ai/chat` - Text chat (streaming)
- `/api/ai/completion` - Text completion
- `/api/ai/enhance-prompt` - Prompt enhancement
- `/api/ai/extract-style` - Style extraction

#### **Plugin APIs**
**Files**: `app/api/plugins/*/route.ts`
- `/api/plugins/renders` - Plugin render endpoint
- `/api/plugins/renders/[renderId]` - Get render status
- Bearer token authentication
- Webhook support

---

## 🏗️ Services Layer

### **Core Render Services**

#### **1. RenderService** (`lib/services/render.ts`)
**Purpose**: High-level render orchestration

**Key Methods**:
- `createProject()` - Create project with image upload
- `createRender()` - Create render record and trigger generation
- `updateRender()` - Update render status and output

**Responsibilities**:
- Project creation
- Render record creation
- Chain management
- Image upload handling
- Integration with AISDKService

---

#### **2. RenderPipeline** (`lib/services/render-pipeline.ts`)
**Purpose**: Full 7-stage Technical Moat Pipeline orchestrator

**Key Methods**:
- `generateRender()` - Complete pipeline execution

**Stages Orchestrated**:
1. Semantic Parsing (Stage 1)
2. Image Understanding (Stage 2)
3. Prompt Optimization (Stage 3)
4. Model Routing (Stage 4)
5. Image Generation (Stage 5)
6. Validation (Stage 6)
7. Memory Extraction (Stage 7)

**Features**:
- Parallel processing where possible
- Graceful fallbacks
- Configurable stage skipping
- Mask-based inpainting support
- Canvas context support

---

#### **3. AISDKService** (`lib/services/ai-sdk-service.ts`)
**Purpose**: Google GenAI SDK wrapper - unified AI operations

**Key Methods**:
- `generateImage()` - Image generation
- `generateVideo()` - Video generation (Veo 3.1)
- `generateText()` - Text generation
- `generateTextWithImage()` - Vision model analysis
- `generateTextWithMultipleImages()` - Multi-image analysis
- `generateTextWithStructuredOutput()` - Structured JSON outputs
- `createChatSession()` - Multi-turn chat sessions
- `sendChatMessage()` - Send message in chat session
- `streamChat()` - Streaming text chat

**Responsibilities**:
- Google GenAI SDK integration
- Model selection
- Image/video generation
- Vision model analysis
- Structured outputs
- Chat session management

---

### **Pipeline Stage Services**

#### **4. SemanticParsingService** (`lib/services/semantic-parsing.ts`)
**Purpose**: Extract design intent from prompts (Stage 1)

**Key Methods**:
- `parseDesignIntent()` - Analyze prompt and extract intent

**Output**: `DesignIntent` with complexity, requirements, etc.

---

#### **5. ImageUnderstandingService** (`lib/services/image-understanding.ts`)
**Purpose**: Analyze reference images (Stage 2)

**Key Methods**:
- `analyzeImage()` - Extract style, palette, geometry, materials

**Output**: `ImageAnalysis` with style codes, palette, geometry

---

#### **6. PromptOptimizer** (`lib/services/prompt-optimizer.ts`)
**Purpose**: Enhanced prompt optimization (Stage 3 - Full Pipeline)

**Key Methods**:
- `optimizePrompt()` - Create optimized prompt using all pipeline inputs

**Uses**: DesignIntent + ImageAnalysis

---

#### **7. SimplePromptOptimizer** (`lib/services/simple-prompt-optimizer.ts`)
**Purpose**: Simple prompt optimization (Stage 3 - Always Enabled)

**Key Methods**:
- `optimizePrompt()` - Basic prompt optimization
- `optimizePromptWithMultipleImages()` - Multi-image optimization

**Uses**: Vision model analysis only

---

#### **8. PromptRefinementService** (`lib/services/prompt-refinement.ts`)
**Purpose**: Refine system-generated prompts (Stage 8 - Detour)

**Key Methods**:
- `refinePrompt()` - Analyze prompt + image and refine
- `quickRefine()` - Lightweight prompt improvement

**When Used**: Tool-generated prompts, system prompts

---

#### **9. ModelRouter** (`lib/services/model-router.ts`)
**Purpose**: Automatic model selection (Stage 4)

**Key Methods**:
- `selectImageModel()` - Select optimal model based on quality, complexity, tool context

**Logic**:
- Simple tasks → Gemini 2.5 Flash Image
- Complex tasks → Gemini 3 Pro Image
- CAD tools → Always Pro Image

---

#### **10. ImageValidator** (`lib/services/image-validator.ts`)
**Purpose**: Validate generated images (Stage 6)

**Key Methods**:
- `validateImage()` - Check perspective, proportions, architectural elements

**Output**: `ValidationResult` with errors and suggestions

---

#### **11. PipelineMemoryService** (`lib/services/pipeline-memory.ts`)
**Purpose**: Extract and save pipeline memory (Stage 7)

**Key Methods**:
- `extractMemory()` - Extract style codes, palette, geometry from generated image
- `saveMemory()` - Save to render's contextData

**Purpose**: Enable consistency across renders in same chain

---

### **Context & Chain Services**

#### **12. CentralizedContextService** (`lib/services/centralized-context-service.ts`)
**Purpose**: Single source of truth for context building

**Key Methods**:
- `buildUnifiedContext()` - Build context from all sources
- `getFinalPrompt()` - Get final enhanced prompt

**Integrates**:
- Version context
- Context prompt
- Pipeline memory
- Reference render context

---

#### **13. RenderChainService** (`lib/services/render-chain.ts`)
**Purpose**: Render chain management

**Key Methods**:
- `getOrCreateDefaultChain()` - Get or create default chain for project
- `getNextChainPosition()` - Get next position in chain
- `getChainContext()` - Get context from chain

**Purpose**: Manage render sequences and relationships

---

#### **14. ChatSessionManager** (`lib/services/chat-session-manager.ts`)
**Purpose**: Multi-turn chat session management

**Key Methods**:
- `getOrCreateChatSession()` - Get or create chat session for chain
- `shouldUseChatAPI()` - Determine if chat API should be used
- `incrementChatTurn()` - Track chat turns

**Purpose**: Enable iterative image editing with conversation history

---

### **Supporting Services**

#### **15. StorageService** (`lib/services/storage.ts`)
**Purpose**: File storage (GCS/S3)

**Key Methods**:
- `uploadFile()` - Upload file to storage
- `getFileUrl()` - Get file URL
- `deleteFile()` - Delete file

---

#### **16. MaskInpaintingService** (`lib/services/mask-inpainting.ts`)
**Purpose**: Mask-based inpainting for canvas

**Key Methods**:
- `inpaintWithMask()` - Generate image with mask

---

#### **17. VideoPipeline** (`lib/services/video-pipeline.ts`)
**Purpose**: Video generation pipeline orchestrator

**Key Methods**:
- `generateVideo()` - Complete video generation pipeline

---

#### **18. VideoPromptOptimizer** (`lib/services/video-prompt-optimizer.ts`)
**Purpose**: Video-specific prompt optimization

**Key Methods**:
- `optimizeVideoPrompt()` - Optimize prompts for video generation

---

## 💾 Data Access Layer (DAL)

### **Core DALs**

#### **1. RendersDAL** (`lib/dal/renders.ts`)
**Purpose**: Render database operations

**Key Methods**:
- `create()` - Create render record
- `getById()` - Get render by ID
- `update()` - Update render
- `updateOutput()` - Update render output URL
- `updateContext()` - Update render contextData
- `getByChainId()` - Get renders in chain
- `getByProjectId()` - Get renders in project
- `getByUserId()` - Get user's renders
- `delete()` - Delete render

**Schema**: `renders` table

---

#### **2. RenderChainsDAL** (`lib/dal/render-chains.ts`)
**Purpose**: Render chain database operations

**Key Methods**:
- `create()` - Create chain
- `getById()` - Get chain by ID
- `getByProjectId()` - Get chains in project
- `update()` - Update chain
- `updateContext()` - Update chain contextData

**Schema**: `renderChains` table

---

#### **3. ProjectsDAL** (`lib/dal/projects.ts`)
**Purpose**: Project database operations

**Key Methods**:
- `create()` - Create project
- `getById()` - Get project by ID
- `getByUserId()` - Get user's projects
- `update()` - Update project
- `delete()` - Delete project

**Schema**: `projects` table

---

#### **4. BillingDAL** (`lib/dal/billing.ts`)
**Purpose**: Billing and credits operations

**Key Methods**:
- `getCredits()` - Get user credits
- `deductCredits()` - Deduct credits
- `addCredits()` - Add credits
- `isUserPro()` - Check if user is Pro
- `getSubscription()` - Get user subscription

**Schema**: `userSubscriptions`, `credits` tables

---

#### **5. ProjectRulesDAL** (`lib/dal/project-rules.ts`)
**Purpose**: Project rules management

**Key Methods**:
- `getActiveRules()` - Get active rules for project
- `create()` - Create rule
- `update()` - Update rule

**Schema**: `projectRules` table

---

### **Other DALs**

- **UsersDAL** (`lib/dal/users.ts`) - User operations
- **ToolsDAL** (`lib/dal/tools.ts`) - Tool operations
- **ActivityDAL** (`lib/dal/activity.ts`) - Activity tracking
- **UsageTrackingDAL** (`lib/dal/usage-tracking.ts`) - Usage tracking
- **WebhooksDAL** (`lib/dal/webhooks.ts`) - Webhook management
- **APIKeysDAL** (`lib/dal/api-keys.ts`) - API key management

---

## 🎣 Hooks & Client Utilities

### **React Hooks**

#### **1. useRenderPipeline** (`lib/hooks/use-render-pipeline.ts`)
**Purpose**: React hook for render generation

**Returns**:
- `generateRender()` - Function to generate render
- `loading` - Loading state
- `error` - Error state
- `result` - Result data

**Usage**:
```typescript
const { generateRender, loading, error } = useRenderPipeline({
  enableFullPipeline: true,
  onSuccess: (result) => console.log(result),
  onError: (error) => console.error(error)
});
```

---

#### **2. useRenderChain** (`lib/hooks/use-render-chain.ts`)
**Purpose**: React hook for render chain management

**Returns**:
- Chain data
- Chain operations
- Loading states

---

#### **3. useUpscaling** (`lib/hooks/use-upscaling.ts`)
**Purpose**: React hook for image upscaling

---

#### **4. useOptimisticGeneration** (`lib/hooks/use-optimistic-generation.ts`)
**Purpose**: React hook for optimistic UI updates

---

#### **5. useNodeExecution** (`lib/hooks/use-node-execution.ts`)
**Purpose**: React hook for node execution (canvas)

---

### **Client Utilities**

#### **Render Form Data** (`lib/utils/render-form-data.ts`)
**Purpose**: Helper for building FormData for render requests

**Functions**:
- `buildRenderFormData()` - Build FormData from render options

---

## ⚡ Server Actions

### **Render Actions**

#### **1. createRenderAction** (`lib/actions/render.actions.ts`)
**Purpose**: Server action for render creation

**Function**: `createRenderAction(formData: FormData)`

**Responsibilities**:
- Extract form data
- Validate input
- Authenticate user
- Check credits
- Create render via RenderService
- Deduct credits
- Return result

**Usage**: Called from client components with FormData

---

#### **2. Other Render Actions**

- **user-renders.actions.ts** - User render operations
- **pipeline.actions.ts** - Pipeline operations
- **projects.actions.ts** - Project operations
- **tools.actions.ts** - Tool operations

---

## 🛠️ Utils & Helpers

### **Security Utils** (`lib/utils/security.ts`)

**Functions**:
- `validatePrompt()` - Validate prompt content
- `sanitizeInput()` - Sanitize user input
- `getSafeErrorMessage()` - Get safe error messages
- `securityLog()` - Security logging
- `isValidUUID()` - UUID validation
- `isValidImageType()` - Image type validation
- `isValidFileSize()` - File size validation
- `redactSensitive()` - Redact sensitive data

---

### **Logger** (`lib/utils/logger.ts`)

**Functions**:
- `logger.log()` - Info logging
- `logger.error()` - Error logging
- `logger.warn()` - Warning logging

---

### **Rate Limiting** (`lib/utils/rate-limit.ts`)

**Functions**:
- `rateLimitMiddleware()` - Rate limiting middleware

---

### **CORS** (`lib/middleware/cors.ts`)

**Functions**:
- `handleCORSPreflight()` - Handle CORS preflight
- `withCORS()` - Add CORS headers

---

### **Sentry Integration**

**Files**:
- `lib/utils/sentry-performance.ts` - Performance tracking
- `lib/utils/sentry-metrics.ts` - Metrics tracking

**Functions**:
- `setTransactionName()` - Set transaction name
- `withDatabaseSpan()` - Database operation tracking
- `withAIOperationSpan()` - AI operation tracking
- `trackRenderStarted()` - Track render start
- `trackRenderCompleted()` - Track render completion

---

## 🔄 Complete Request Flow

### **Image Generation Flow**

```
1. User submits render request (FormData)
   ↓
2. API Route: /api/renders (handleRenderRequest)
   ├─ Authentication (Bearer token or cookie)
   ├─ Rate limiting
   ├─ Request validation
   └─ Credit check
   ↓
3. Context Building (CentralizedContextService)
   ├─ Version context
   ├─ Context prompt
   ├─ Pipeline memory
   └─ Reference render context
   ↓
4. Prompt Refinement (PromptRefinementService) [if tool-generated]
   ├─ Analyze system prompt
   ├─ Analyze reference image
   └─ Create refined prompt
   ↓
5. Full Pipeline Check (ENABLE_FULL_PIPELINE)
   ├─ If enabled → RenderPipeline.generateRender()
   │  ├─ Stage 1: Semantic Parsing
   │  ├─ Stage 2: Image Understanding
   │  ├─ Stage 3: Prompt Optimization
   │  ├─ Stage 4: Model Routing
   │  ├─ Stage 5: Image Generation
   │  ├─ Stage 6: Validation
   │  └─ Stage 7: Memory Extraction
   │
   └─ If disabled → Simple flow
      ├─ Simple Prompt Optimization
      ├─ Model Routing
      └─ Image Generation
   ↓
6. Image Generation (AISDKService)
   ├─ Model selection (ModelRouter)
   ├─ Chat API check (if iterative edit)
   └─ generateImage() or sendChatMessage()
   ↓
7. Storage (StorageService)
   ├─ Upload generated image
   └─ Get public URL
   ↓
8. Database Update (RendersDAL)
   ├─ Update render status
   ├─ Update output URL
   ├─ Update contextData (pipeline memory)
   └─ Update processing time
   ↓
9. Response
   ├─ Return render data
   ├─ Return image URL
   └─ Return metadata
```

---

### **Video Generation Flow**

```
1. User submits video request
   ↓
2. API Route: /api/video
   ├─ Authentication
   ├─ Validation
   └─ Credit check
   ↓
3. Video Pipeline (VideoPipeline)
   ├─ Prompt optimization
   ├─ Model routing (Veo 3.1)
   └─ Video generation
   ↓
4. Video Generation (AISDKService.generateVideo())
   ├─ Reference images (up to 3)
   ├─ First/last frame interpolation
   └─ Video extension
   ↓
5. Storage & Database
   └─ Upload video and update records
   ↓
6. Response
   └─ Return video URL and metadata
```

---

## 📊 Key Data Structures

### **Render Record** (`renders` table)
```typescript
{
  id: string;
  projectId: string;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chainId: string;
  chainPosition: number;
  referenceRenderId: string;
  outputUrl: string;
  outputKey: string;
  contextData: JSONB; // Pipeline memory, version context, etc.
  metadata: JSONB; // Platform, plugin version, etc.
}
```

### **Render Chain** (`renderChains` table)
```typescript
{
  id: string;
  projectId: string;
  name: string;
  contextData: JSONB; // Chain-level context
  googleChatSessionId: string; // For multi-turn chat
  lastChatTurn: number;
}
```

---

## 🔐 Security & Validation

### **Authentication**
- Bearer token (plugins)
- Cookie-based (web)
- API key (plugins)

### **Validation**
- Prompt validation (length, content)
- Image type validation
- File size validation
- UUID validation
- Rate limiting

### **Security Logging**
- Security events logged
- Sensitive data redacted
- Error messages sanitized

---

## 📈 Performance Optimizations

1. **Parallel Processing**: Pipeline stages run in parallel where possible
2. **Caching**: User auth caching, context caching
3. **Lazy Loading**: Services loaded on demand
4. **Batch Operations**: Batch rendering support
5. **Streaming**: Streaming responses for chat API

---

## 🧪 Testing

### **Test Files**
- `tests/` - Test files
- `vitest.config.ts` - Vitest configuration

### **Test Coverage**
- Unit tests for services
- Integration tests for API routes
- E2E tests for complete flows

---

## 📝 Summary

The Render Infrastructure is a comprehensive, multi-layered system:

1. **API Layer**: HTTP endpoints with authentication, validation, rate limiting
2. **Service Layer**: Business logic, orchestration, AI integration
3. **DAL Layer**: Database operations, data access
4. **Hook Layer**: React hooks for client-side usage
5. **Action Layer**: Server actions for form handling
6. **Utils Layer**: Helpers, security, logging, performance tracking

**Key Features**:
- ✅ Full Technical Moat Pipeline (7 stages)
- ✅ Prompt refinement for system prompts
- ✅ Multi-turn chat support
- ✅ Batch rendering
- ✅ Project rules
- ✅ Version context
- ✅ Pipeline memory
- ✅ Mask-based inpainting
- ✅ Video generation
- ✅ Plugin support
- ✅ Webhook support

---

**End of Architecture Documentation**

