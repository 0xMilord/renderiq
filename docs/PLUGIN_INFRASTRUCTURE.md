# Renderiq Plugin Infrastructure - Technical Blueprint

## Executive Summary

This document outlines the unified plugin infrastructure that enables Renderiq to integrate seamlessly with AEC tools (SketchUp, Revit, AutoCAD, Rhino, ArchiCAD, Blender). The architecture reuses existing infrastructure while providing a consistent API layer for all plugins.

**Goal**: Transform Renderiq from a standalone tool into the default AI visualization layer for the entire AEC ecosystem.

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Current System Analysis](#current-system-analysis)
3. [Unified Plugin API Architecture](#unified-plugin-api-architecture)
4. [Authentication & Security](#authentication--security)
5. [Data Flow & Services](#data-flow--services)
6. [Storage Architecture](#storage-architecture)
7. [API Endpoints](#api-endpoints)
8. [Plugin Implementation Guide](#plugin-implementation-guide)
9. [Multi-Tool Support Strategy](#multi-tool-support-strategy)
10. [Development Roadmap](#development-roadmap)

---

## Infrastructure Overview

### Core Principles

1. **Reuse Existing Infrastructure**: Leverage current services, DAL, auth, storage, and APIs
2. **Unified API Layer**: Single consistent API interface for all plugins
3. **Platform-Agnostic**: Work with any desktop AEC application
4. **Secure by Default**: Bearer token authentication with proper validation
5. **Scalable Architecture**: Support multiple tools without code duplication

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AEC Desktop Applications                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │SketchUp  │  │  Revit   │  │ AutoCAD  │  │  Rhino   │  ...  │
│  │ Plugin   │  │  Plugin  │  │  Plugin  │  │  Plugin  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴─────────────┴─────────────┘              │
│                          │                                      │
│              Renderiq Plugin API Adapter                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS + Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Renderiq Unified Plugin API Layer                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  /api/plugins/auth/*      - Authentication             │    │
│  │  /api/plugins/renders/*   - Render Requests            │    │
│  │  /api/plugins/projects/*  - Project Management         │    │
│  │  /api/plugins/credits/*   - Credit Balance             │    │
│  │  /api/plugins/status/*    - Render Status              │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Auth       │  │   Render     │  │   Storage    │
│   Service    │  │   Service    │  │   Service    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       ▼                 ▼                  ▼
┌───────────────────────────────────────────────────┐
│          Existing Infrastructure Layer            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Supabase │  │    GCS   │  │   AI     │       │
│  │   Auth   │  │ Storage  │  │   SDK    │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   DAL    │  │ Billing  │  │ Projects │       │
│  │  Layer   │  │ Service  │  │   DAL    │       │
│  └──────────┘  └──────────┘  └──────────┘       │
└───────────────────────────────────────────────────┘
```

---

## Current System Analysis

### ✅ Existing Infrastructure Components

#### 1. Authentication System

**Location**: `lib/services/sketchup-auth.ts`, `lib/services/auth-cache.ts`

**Current Implementation**:
- Bearer token authentication already supported
- Uses Supabase Auth (`@supabase/ssr`)
- Token validation via `getUserFromBearerToken()`
- Session caching for performance

**Reusable Components**:
```typescript
// lib/services/sketchup-auth.ts
export async function getUserFromBearerToken(token: string): Promise<{ user: User | null; error?: string }>

// lib/services/auth-cache.ts
export async function getCachedUser(): Promise<{ user: User | null; fromCache: boolean }>
```

**API Endpoints**:
- `POST /api/sketchup-extension/auth/signin` - User authentication
- `GET /api/sketchup-extension/auth/me` - Get user info

**Status**: ✅ Production-ready, can be extended to support all plugins

---

#### 2. Render Service

**Location**: `lib/services/render.ts`, `app/api/renders/route.ts`

**Current Implementation**:
- Handles FormData with image uploads
- Integrates with AISDKService for image generation
- Credit deduction via BillingDAL
- Project creation via ProjectsDAL
- Render tracking via RendersDAL

**Key Functions**:
```typescript
// lib/services/render.ts
class RenderService {
  async createProject(userId, file, projectName, ...)
  // Handles project creation with file upload
}

// app/api/renders/route.ts
export async function handleRenderRequest(request: NextRequest)
// Main render handler with authentication, validation, AI processing
```

**Status**: ✅ Production-ready, handles SketchUp extension requests

---

#### 3. Storage Service

**Location**: `lib/services/storage.ts`, `lib/services/gcs-storage.ts`

**Current Implementation**:
- Dual-write support (Supabase Storage + GCS)
- CDN support via `GCS_CDN_DOMAIN`
- Organized file structure: `projects/{slug}/{userId}/{filename}`
- Public URL generation with CDN fallback

**Key Functions**:
```typescript
// lib/services/storage.ts
export class StorageService {
  static async uploadFile(
    file: File | Buffer,
    bucket: 'renders' | 'uploads' | 'receipts',
    userId: string,
    fileName?: string,
    projectSlug?: string
  ): Promise<{ url: string; key: string; id: string }>
}
```

**Storage Buckets**:
- `renderiq-renders` - Final rendered images
- `renderiq-uploads` - User-uploaded source images
- `renderiq-receipts` - Private payment receipts

**Status**: ✅ Production-ready, supports all storage needs

---

#### 4. AI SDK Service

**Location**: `lib/services/ai-sdk-service.ts`

**Current Implementation**:
- Uses `@google/genai` SDK
- Supports Gemini 3 Pro Image, Gemini 2.5 Flash
- Handles image generation with various parameters:
  - Aspect ratios: 1:1, 16:9, 4:3, 9:16, etc.
  - Image sizes: 1K, 2K, 4K
  - Style transfer support
  - Seed for reproducibility

**Key Functions**:
```typescript
// lib/services/ai-sdk-service.ts
class AISDKService {
  async generateImage(request: {
    prompt: string;
    aspectRatio: string;
    uploadedImageData?: string;
    uploadedImageType?: string;
    mediaResolution?: 'LOW' | 'MEDIUM' | 'HIGH';
    imageSize?: '1K' | '2K' | '4K';
    model?: string;
  }): Promise<ImageGenerationResult>
}
```

**Status**: ✅ Production-ready, extensible for new models

---

#### 5. Data Access Layer (DAL)

**Location**: `lib/dal/*`

**Current Implementation**:

**RendersDAL** (`lib/dal/renders.ts`):
- Create, read, update renders
- Query by user, project, status
- Platform-aware (render/tools/canvas)

**ProjectsDAL** (`lib/dal/projects.ts`):
- Project CRUD operations
- Slug generation and uniqueness
- Platform filtering

**BillingDAL** (`lib/dal/billing.ts`):
- Credit balance management
- Transaction tracking
- Subscription management

**Status**: ✅ Production-ready, well-structured

---

#### 6. Billing & Credits System

**Location**: `lib/services/billing.ts`, `lib/dal/billing.ts`

**Current Implementation**:
- Credit balance tracking
- Credit deduction on renders
- Transaction history
- Monthly reset support
- Plan limits enforcement

**Credit Costs** (from `lib/config/models.ts`):
- Standard (1080p): 5 credits
- High (4K): 10 credits
- Ultra (4K Enhanced): 15 credits

**API Endpoint**:
- `GET /api/sketchup-extension/credits` - Get credit balance

**Status**: ✅ Production-ready

---

### 🔧 Components Needing Extension

#### 1. Unified Plugin API Routes

**Current**: Plugin-specific routes (`/api/sketchup-extension/*`)

**Needed**: Unified routes (`/api/plugins/*`) that work for all tools

**Action Required**: Create abstraction layer

---

#### 2. API Key Management

**Current**: No API key generation system for plugins

**Needed**: 
- API key generation endpoint
- API key validation middleware
- API key scoping (read/write/admin)

**Action Required**: Build API key infrastructure

---

#### 3. Platform Metadata

**Current**: Platform enum: `'render' | 'tools' | 'canvas'`

**Needed**: Extend to include plugin platforms:
- `'sketchup'`
- `'revit'`
- `'autocad'`
- `'rhino'`
- `'archicad'`
- `'blender'`

**Action Required**: Update schema and services

---

## Unified Plugin API Architecture

### API Base URL

```
Production: https://renderiq.io/api/plugins
Development: http://localhost:3000/api/plugins
```

### Authentication

All plugin API requests require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

**Token Source**:
1. User signs in via `/api/plugins/auth/signin`
2. Receives `access_token` and `refresh_token`
3. Stores token securely in plugin settings
4. Uses token for all subsequent requests

### API Endpoint Structure

```
/api/plugins/
├── auth/
│   ├── signin          POST    - Authenticate user
│   ├── signout         POST    - Invalidate token
│   ├── refresh         POST    - Refresh access token
│   └── me              GET     - Get current user
│
├── renders/
│   ├──                 POST    - Create render request
│   ├── [renderId]      GET     - Get render status
│   └── [renderId]      DELETE  - Cancel render
│
├── projects/
│   ├──                 GET     - List projects
│   ├──                 POST    - Create project
│   ├── [projectId]     GET     - Get project details
│   └── [projectId]     DELETE  - Delete project
│
├── credits/
│   └──                 GET     - Get credit balance
│
├── settings/
│   ├──                 GET     - Get user settings
│   └──                 PUT     - Update user settings
│
└── health/
    └──                 GET     - API health check
```

---

## Authentication & Security

### Authentication Flow

```
┌─────────────┐
│   Plugin    │
│  (Desktop)  │
└──────┬──────┘
       │ 1. User enters credentials
       ▼
┌─────────────────────────────────────┐
│ POST /api/plugins/auth/signin       │
│ { email, password }                 │
└──────┬──────────────────────────────┘
       │
       │ 2. Validate credentials
       ▼
┌─────────────────────────────────────┐
│ Supabase Auth                       │
│ - Verify email/password             │
│ - Generate JWT token                │
└──────┬──────────────────────────────┘
       │
       │ 3. Return tokens
       ▼
┌─────────────────────────────────────┐
│ {                                   │
│   success: true,                    │
│   access_token: "...",              │
│   refresh_token: "...",             │
│   expires_at: "2025-01-01T...",    │
│   user: { id, email, ... }          │
│ }                                   │
└──────┬──────────────────────────────┘
       │
       │ 4. Store token securely
       ▼
┌─────────────┐
│   Plugin    │
│  Settings   │
│ (Encrypted) │
└─────────────┘
```

### Token Storage Recommendations

**SketchUp (Ruby)**:
```ruby
# Store in SketchUp model attributes (encrypted in production)
model = Sketchup.active_model
dict = model.attribute_dictionary('RenderIQ_Auth', true)
dict['access_token'] = encrypted_token
```

**Revit (C#)**:
```csharp
// Use Windows Credential Manager or encrypted config file
var creds = new Credential();
creds.Target = "Renderiq_Plugin";
creds.Username = userId;
creds.SecurePassword = SecureStringFromToken(token);
creds.Save();
```

**AutoCAD (C#/.NET)**:
```csharp
// Use secure registry or encrypted XML config
RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Renderiq");
key.SetValue("Token", Encrypt(token), RegistryValueKind.String);
```

### Security Best Practices

1. **Never log tokens**: Filter tokens from logs
2. **HTTPS only**: All API communication over HTTPS
3. **Token expiration**: Tokens expire after 1 hour, refresh required
4. **Rate limiting**: Prevent abuse with rate limits
5. **Input validation**: Sanitize all inputs
6. **Error messages**: Don't leak sensitive info in errors

### Rate Limiting

**Current Implementation**: `lib/utils/rate-limit.ts`

```typescript
// Default limits per endpoint
rateLimitMiddleware(request, {
  maxRequests: 30,
  windowMs: 60000  // 1 minute
})
```

**Plugin-Specific Limits**:
- Render requests: 10 per minute per user
- Status checks: 60 per minute per user
- Auth requests: 5 per minute per IP

---

## Data Flow & Services

### Render Request Flow

```
┌──────────────┐
│   Plugin     │
│  Captures    │
│  Screenshot  │
└──────┬───────┘
       │
       │ 1. POST /api/plugins/renders
       │    FormData: {
       │      prompt, image, settings
       │    }
       ▼
┌──────────────────────────────────────┐
│  Plugin API Handler                  │
│  - Validate Bearer token             │
│  - Check user credits                │
│  - Validate inputs                   │
└──────┬───────────────────────────────┘
       │
       │ 2. Delegate to existing handler
       ▼
┌──────────────────────────────────────┐
│  handleRenderRequest()               │
│  (app/api/renders/route.ts)          │
│  - Upload image to Storage           │
│  - Create render record              │
│  - Deduct credits                    │
└──────┬───────────────────────────────┘
       │
       │ 3. Process with AI
       ▼
┌──────────────────────────────────────┐
│  AISDKService.generateImage()        │
│  - Call Gemini API                   │
│  - Generate image                    │
└──────┬───────────────────────────────┘
       │
       │ 4. Save result
       ▼
┌──────────────────────────────────────┐
│  StorageService.uploadFile()         │
│  - Upload to GCS/Supabase            │
│  - Get CDN URL                       │
└──────┬───────────────────────────────┘
       │
       │ 5. Update render record
       ▼
┌──────────────────────────────────────┐
│  RendersDAL.update()                 │
│  - Set outputUrl                     │
│  - Set status: 'completed'           │
└──────┬───────────────────────────────┘
       │
       │ 6. Plugin polls for status
       ▼
┌──────────────────────────────────────┐
│  GET /api/plugins/renders/[id]       │
│  Returns: {                          │
│    status: 'completed',              │
│    outputUrl: 'https://cdn...'       │
│  }                                   │
└──────────────────────────────────────┘
```

### Service Layer Reuse

**All services are reusable as-is**:

```typescript
// ✅ AISDKService - No changes needed
const aiService = AISDKService.getInstance();
await aiService.generateImage({ ... });

// ✅ StorageService - No changes needed
await StorageService.uploadFile(file, 'uploads', userId);

// ✅ RenderService - No changes needed
await renderService.createProject(userId, file, name);

// ✅ BillingDAL - No changes needed
await BillingDAL.deductCredits(userId, amount);
await BillingDAL.getUserCredits(userId);

// ✅ ProjectsDAL - No changes needed
await ProjectsDAL.create({ userId, name, ... });

// ✅ RendersDAL - No changes needed
await RendersDAL.create({ userId, prompt, ... });
```

---

## Storage Architecture

### File Organization

```
Storage Buckets:
├── renderiq-uploads/
│   └── projects/
│       └── {project-slug}/
│           └── {userId}/
│               └── {filename}
│
├── renderiq-renders/
│   └── projects/
│       └── {project-slug}/
│           └── {userId}/
│               └── {render-id}.png
│
└── renderiq-receipts/
    └── receipts/
        └── {userId}/
            └── {receipt-id}.pdf
```

### CDN Configuration

**Current Setup**:
- Primary: Google Cloud Storage with Cloud CDN
- CDN Domain: `cdn.renderiq.io` (configurable via `GCS_CDN_DOMAIN`)
- Fallback: Direct GCS URLs if CDN unavailable

**URL Generation**:
```typescript
// lib/services/storage.ts
const publicUrl = CDN_DOMAIN
  ? `https://${CDN_DOMAIN}/${filePath}`
  : `https://storage.googleapis.com/${bucket}/${filePath}`;
```

**Cache Headers**:
- Images: 1 year cache (`Cache-Control: public, max-age=31536000`)
- Dynamic content: 1 hour cache

### Plugin Upload Flow

```typescript
// Plugin sends image as base64 or file
POST /api/plugins/renders
Content-Type: multipart/form-data

FormData:
  - prompt: string
  - uploadedImageData: base64 string
  - uploadedImageType: "image/png"
  - quality: "high"
  - aspectRatio: "16:9"
  - style: "photorealistic"
  - projectId: uuid (optional)
```

**Server Processing**:
1. Decode base64 to Buffer
2. Upload to `renderiq-uploads` bucket
3. Process with AI
4. Save result to `renderiq-renders` bucket
5. Return CDN URL

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/plugins/auth/signin`

Authenticate user and get access token.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2025-01-01T12:00:00Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

#### GET `/api/plugins/auth/me`

Get current user info from token.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "credits": {
      "balance": 100,
      "totalEarned": 500,
      "totalSpent": 400
    }
  }
}
```

---

### Render Endpoints

#### POST `/api/plugins/renders`

Create a new render request.

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**FormData**:
```
prompt: string (optional, system prompt generated if not provided)
uploadedImageData: base64 string (required)
uploadedImageType: "image/png" | "image/jpeg" (required)
quality: "standard" | "high" | "ultra" (default: "high")
aspectRatio: "16:9" | "4:3" | "1:1" | "9:16" (default: "16:9")
style: "photorealistic" | "dramatic" | "soft" | "studio" | "natural" (default: "photorealistic")
model: "gemini-3-pro-image-preview" | "gemini-2.5-flash-image" (optional)
projectId: uuid (optional)
platform: "sketchup" | "revit" | "autocad" | ... (auto-detected from user-agent)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "processing",
    "creditsCost": 10,
    "estimatedTime": 30
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Insufficient credits",
  "requiredCredits": 10,
  "availableCredits": 5
}
```

---

#### GET `/api/plugins/renders/[renderId]`

Get render status and result.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (Processing):
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "processing",
    "progress": 60,
    "estimatedTimeRemaining": 15
  }
}
```

**Response** (Completed):
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "completed",
    "outputUrl": "https://cdn.renderiq.io/projects/.../render.png",
    "processingTime": 28.5,
    "creditsUsed": 10
  }
}
```

**Response** (Failed):
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "failed",
    "error": "AI generation failed",
    "errorCode": "GENERATION_ERROR"
  }
}
```

---

### Project Endpoints

#### GET `/api/plugins/projects`

List user's projects (for plugin platform).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```
platform?: "sketchup" | "revit" | ...
limit?: number (default: 50)
offset?: number (default: 0)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "slug": "project-name",
        "createdAt": "2025-01-01T00:00:00Z",
        "renderCount": 5
      }
    ],
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### POST `/api/plugins/projects`

Create a new project.

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**FormData**:
```
name: string (required)
description?: string
image?: File (optional, can create project without image)
platform: "sketchup" | "revit" | ... (required)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "slug": "project-name",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### Credits Endpoint

#### GET `/api/plugins/credits`

Get user's credit balance.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 100,
    "totalEarned": 500,
    "totalSpent": 400,
    "monthlyEarned": 50,
    "monthlySpent": 30
  }
}
```

---

## Plugin Implementation Guide

### Platform Detection

Plugins should include platform identifier in requests:

**Option 1: User-Agent Header** (Recommended)
```http
User-Agent: Renderiq-Plugin/SketchUp/1.0.0
User-Agent: Renderiq-Plugin/Revit/1.0.0
```

**Option 2: Platform Parameter**
```http
X-Renderiq-Platform: sketchup
X-Renderiq-Platform: revit
```

**Server-Side Detection**:
```typescript
// lib/utils/platform-detection.ts
export function detectPlatform(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const platformHeader = request.headers.get('x-renderiq-platform');
  
  if (platformHeader) return platformHeader.toLowerCase();
  
  if (userAgent.includes('SketchUp')) return 'sketchup';
  if (userAgent.includes('Revit')) return 'revit';
  if (userAgent.includes('AutoCAD')) return 'autocad';
  if (userAgent.includes('Rhino')) return 'rhino';
  if (userAgent.includes('ArchiCAD')) return 'archicad';
  if (userAgent.includes('Blender')) return 'blender';
  
  return 'unknown';
}
```

### Error Handling

**Standard Error Response Format**:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "errorCode": "ERROR_CODE",
  "details": { /* Optional additional info */ }
}
```

**Common Error Codes**:
- `AUTH_REQUIRED` - Missing or invalid token
- `INSUFFICIENT_CREDITS` - Not enough credits
- `INVALID_INPUT` - Invalid request parameters
- `RENDER_FAILED` - AI generation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - Temporary service issue

### Retry Logic

**Recommended Retry Strategy**:
```typescript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry on 5xx errors (server errors)
      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      
      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### Status Polling

**Recommended Polling Strategy**:
```typescript
async function pollRenderStatus(renderId, token, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/plugins/renders/${renderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.data.status === 'completed') {
      return data.data.outputUrl;
    }
    
    if (data.data.status === 'failed') {
      throw new Error(data.data.error);
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, then 10s intervals
    const delay = Math.min(1000 * Math.pow(2, Math.min(i, 3)), 10000);
    await sleep(delay);
  }
  
  throw new Error('Render timeout');
}
```

---

## Multi-Tool Support Strategy

### Tool-Specific Considerations

#### 1. SketchUp (Ruby)

**Language**: Ruby
**API**: SketchUp Ruby API
**Package Format**: RBZ (ZIP archive)

**Implementation**:
- ✅ Already implemented
- Uses Net::HTTP for API calls
- Stores tokens in SketchUp model attributes
- UI via WebDialog

**File Structure**:
```
renderiq/
├── renderiq.rb          # Main loader
├── renderiq/
│   ├── loader.rb
│   ├── api_client.rb
│   ├── auth_manager.rb
│   └── ...
└── resources/
    └── icons/
```

---

#### 2. Revit (C#)

**Language**: C#
**API**: Revit API (.NET)
**Package Format**: `.addin` manifest + DLL

**Implementation**:
- Use `HttpClient` for API calls
- Store tokens in Windows Credential Manager
- UI via WPF or Revit TaskDialog

**File Structure**:
```
RenderiqPlugin/
├── RenderiqPlugin.addin    # Manifest
├── RenderiqPlugin.dll      # Compiled plugin
└── Resources/
    └── icons/
```

**Sample Code**:
```csharp
using System.Net.Http;
using System.Net.Http.Headers;

public class RenderiqClient {
    private HttpClient client;
    private string accessToken;
    
    public async Task<RenderResult> CreateRender(byte[] imageData, RenderSettings settings) {
        var formData = new MultipartFormDataContent();
        formData.Add(new StringContent(settings.Prompt), "prompt");
        formData.Add(new ByteArrayContent(imageData), "uploadedImageData", "image.png");
        // ... add other fields
        
        client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await client.PostAsync("/api/plugins/renders", formData);
        return await response.Content.ReadFromJsonAsync<RenderResult>();
    }
}
```

---

#### 3. AutoCAD (C#/.NET)

**Language**: C#
**API**: AutoCAD .NET API
**Package Format**: `.bundle` (AutoCAD Package)

**Implementation**:
- Similar to Revit (C#/.NET)
- Use AutoCAD's Command system
- UI via WPF or AutoCAD's dialog system

---

#### 4. Rhino (Python/C#)

**Language**: Python (preferred) or C#
**API**: RhinoCommon (Python/C#)
**Package Format**: `.rhp` (Rhino Python Package) or `.rhp` (C#)

**Implementation**:
- Python: Use `requests` library
- C#: Use `HttpClient` (same as Revit)
- UI via Rhino's dialog system

**Python Sample**:
```python
import requests

class RenderiqClient:
    def __init__(self, access_token):
        self.base_url = "https://renderiq.io/api/plugins"
        self.headers = {
            "Authorization": f"Bearer {access_token}"
        }
    
    def create_render(self, image_data, settings):
        files = {
            "uploadedImageData": (None, image_data),
            "uploadedImageType": (None, "image/png"),
            "quality": (None, settings.quality),
            # ... other fields
        }
        
        response = requests.post(
            f"{self.base_url}/renders",
            headers=self.headers,
            files=files
        )
        return response.json()
```

---

#### 5. ArchiCAD (C++)

**Language**: C++
**API**: ArchiCAD API (C++)
**Package Format**: `.gsm` (GDL Script) or `.dll` (C++ Add-on)

**Implementation**:
- Use libcurl or similar HTTP library
- Store tokens in registry or config file
- UI via ArchiCAD's dialog system

---

#### 6. Blender (Python)

**Language**: Python
**API**: Blender Python API
**Package Format**: `.zip` (Blender Add-on)

**Implementation**:
- Use `requests` library (same as Rhino)
- Store tokens in Blender preferences
- UI via Blender's bpy.props and UI panels

**Blender Add-on Structure**:
```
renderiq_blender/
├── __init__.py          # Add-on registration
├── operators.py         # Render operators
├── panels.py            # UI panels
├── api_client.py        # API communication
└── auth.py              # Authentication
```

---

### Unified Plugin SDK (Future)

**Goal**: Create a shared SDK that plugins can use

**Structure**:
```
renderiq-plugin-sdk/
├── javascript/          # For web-based plugins
├── python/              # For Blender, Rhino
├── csharp/              # For Revit, AutoCAD
├── ruby/                # For SketchUp (reference)
└── cpp/                 # For ArchiCAD (reference)
```

**Features**:
- Shared authentication logic
- Standardized API client
- Error handling
- Retry logic
- Status polling

**Benefits**:
- Consistent behavior across plugins
- Easier maintenance
- Faster plugin development

---

## Development Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Extend existing infrastructure for multi-plugin support

**Tasks**:
1. ✅ Create unified plugin API routes (`/api/plugins/*`)
2. ✅ Add platform detection utility
3. ✅ Extend platform enum to include plugin platforms
4. ✅ Create plugin API documentation
5. ✅ Add plugin-specific error codes
6. ✅ Implement rate limiting per platform

**Deliverables**:
- Unified API endpoints
- Platform detection system
- Updated documentation

---

### Phase 2: SketchUp Enhancement (Week 3)

**Goal**: Enhance existing SketchUp plugin with new API

**Tasks**:
1. Update SketchUp plugin to use unified API
2. Add platform identification
3. Improve error handling
4. Add retry logic
5. Test thoroughly

**Deliverables**:
- Enhanced SketchUp plugin
- Test results

---

### Phase 3: Revit Plugin (Week 4-5)

**Goal**: Build Revit plugin using unified API

**Tasks**:
1. Set up Revit plugin project structure
2. Implement authentication flow
3. Implement render request flow
4. Build UI (settings, render dialog)
5. Test and debug

**Deliverables**:
- Working Revit plugin
- Installation guide
- User documentation

---

### Phase 4: AutoCAD Plugin (Week 6)

**Goal**: Build AutoCAD plugin

**Tasks**:
1. Set up AutoCAD plugin project
2. Adapt Revit codebase for AutoCAD
3. Implement AutoCAD-specific UI
4. Test and debug

**Deliverables**:
- Working AutoCAD plugin

---

### Phase 5: Blender Add-on (Week 7)

**Goal**: Build Blender add-on

**Tasks**:
1. Set up Blender add-on structure
2. Implement Python API client
3. Build Blender UI panels
4. Test and debug

**Deliverables**:
- Working Blender add-on

---

### Phase 6: Rhino Plugin (Week 8)

**Goal**: Build Rhino plugin

**Tasks**:
1. Choose Python or C# implementation
2. Set up Rhino plugin project
3. Implement plugin functionality
4. Test and debug

**Deliverables**:
- Working Rhino plugin

---

### Phase 7: Polish & Optimization (Week 9-10)

**Goal**: Optimize and polish all plugins

**Tasks**:
1. Performance optimization
2. Error handling improvements
3. User experience enhancements
4. Documentation updates
5. Beta testing

**Deliverables**:
- Production-ready plugins
- Complete documentation
- Beta test results

---

### Phase 8: Launch (Week 11-12)

**Goal**: Launch plugins to users

**Tasks**:
1. Final testing
2. Marketing materials
3. Extension warehouse submissions
4. Launch announcement
5. Monitor and support

**Deliverables**:
- Published plugins
- Marketing campaign
- Support documentation

---

## Implementation Checklist

### Unified API Routes

- [ ] Create `/api/plugins/auth/*` routes
- [ ] Create `/api/plugins/renders/*` routes
- [ ] Create `/api/plugins/projects/*` routes
- [ ] Create `/api/plugins/credits` route
- [ ] Create `/api/plugins/settings/*` routes
- [ ] Create `/api/plugins/health` route

### Platform Support

- [ ] Extend platform enum in schema
- [ ] Add platform detection utility
- [ ] Update DAL to support plugin platforms
- [ ] Add platform filtering to queries

### Authentication

- [ ] Extend auth routes for plugins
- [ ] Add token refresh endpoint
- [ ] Implement token validation middleware
- [ ] Add rate limiting per platform

### Documentation

- [ ] API reference documentation
- [ ] Plugin development guide
- [ ] Tool-specific guides (Revit, AutoCAD, etc.)
- [ ] Troubleshooting guide

### Testing

- [ ] Unit tests for API routes
- [ ] Integration tests for plugins
- [ ] End-to-end tests
- [ ] Performance tests

---

## Conclusion

The Renderiq plugin infrastructure leverages existing, battle-tested components while providing a unified API layer for all AEC tools. By reusing services, DAL, storage, and AI SDK, we can rapidly deploy plugins across multiple platforms with minimal code duplication.

**Key Advantages**:
1. ✅ **Fast Development**: Reuse existing infrastructure
2. ✅ **Consistency**: Unified API ensures consistent behavior
3. ✅ **Maintainability**: Single codebase for core logic
4. ✅ **Scalability**: Easy to add new platforms
5. ✅ **Security**: Battle-tested authentication and validation

**Next Steps**:
1. Implement unified plugin API routes
2. Enhance SketchUp plugin
3. Build Revit plugin
4. Expand to other platforms

---

## Appendix

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://renderiq.io
API_RATE_LIMIT_MAX_REQUESTS=30
API_RATE_LIMIT_WINDOW_MS=60000

# Storage
STORAGE_PROVIDER=gcs
GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
GCS_CDN_DOMAIN=cdn.renderiq.io

# AI
GEMINI_API_KEY=your-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Useful Links

- [SketchUp Developer Center](https://developer.sketchup.com/)
- [Revit API Documentation](https://www.revitapidocs.com/)
- [AutoCAD .NET Developer Guide](https://www.autodesk.com/developer-network/platform-technologies/autocad)
- [Rhino Developer Docs](https://developer.rhino3d.com/)
- [Blender Python API](https://docs.blender.org/api/current/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-01  
**Author**: Renderiq Engineering Team

