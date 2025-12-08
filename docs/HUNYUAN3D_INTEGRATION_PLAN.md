# Hunyuan3D Integration Plan for RenderIQ

## Overview

**Hunyuan3D** is Tencent's high-resolution 3D asset generation system using large-scale diffusion models. **Note**: Hunyuan3D-2.5 may not be fully open-source yet, but **Hunyuan3D-2.0 and 2.1 are confirmed open-source**. It enables:
- **Image-to-3D**: Convert single or multi-view images into 3D meshes
- **Text-to-3D**: Generate 3D models from text descriptions
- **Texture Generation**: Apply textures to existing or generated 3D meshes
- **High-Resolution Output**: Supports detailed 3D assets suitable for architecture visualization

**Official GitHub**: https://github.com/Tencent-Hunyuan/Hunyuan3D-2  
**Hunyuan3D Studio (Web Platform)**: https://3d.hunyuan.tencent.com/  
**Model Weights (HuggingFace)**: https://huggingface.co/tencent/Hunyuan3D-2

---

## Key Capabilities

### 1. **Shape Generation (Hunyuan3D-DiT)**
- **Image-to-3D**: Single or multi-view image input → 3D mesh output
- **Text-to-3D**: Text prompt → 3D mesh output
- Multiple model variants:
  - `Hunyuan3D-DiT-v2-0`: Full quality (1.1B params) - Open-source
  - `Hunyuan3D-DiT-v2-0-Turbo`: Fast inference with step distillation
  - `Hunyuan3D-DiT-v2-0-Fast`: Guidance distillation model
  - `Hunyuan3D-DiT-v2-mini`: Lightweight version
  - `Hunyuan3D-DiT-v2-mv`: Multi-view optimized

### 2. **Texture Generation (Hunyuan3D-Paint)**
- Apply textures to 3D meshes
- Image-guided texture synthesis
- Handcrafted mesh texturing support
- PBR (Physically Based Rendering) texture generation
- Models:
  - `Hunyuan3D-Paint-v2-0`: Texture generation model (1.3B params)
  - `Hunyuan3D-Paint-v2-0-Turbo`: Distillation texture model

### 3. **Open-Source Status**
- ✅ **Hunyuan3D-2.0**: Fully open-source (code + weights on HuggingFace)
- ✅ **Hunyuan3D-2.1**: Fully open-source
- ⚠️ **Hunyuan3D-2.5**: May not be fully open-source yet (check GitHub issues)
- ✅ **Hunyuan3D AI API**: Cloud service with Python SDK (requires API key)

### 4. **Deployment Options**
- **Hunyuan3D AI API**: Cloud service with Python SDK (recommended for MVP)
- **Self-Hosted API Server**: Deploy on your own GPU infrastructure
- **Python API**: Diffusers-like interface (direct integration)
- **Docker Container**: Containerized deployment option
- **Gradio App**: Web UI interface (can be wrapped as API)
- **Blender Addon**: Community-developed (unofficial)
- **ComfyUI Nodes**: Community-developed nodes for workflows

### 5. **System Architecture Highlights**
Based on official technical architecture documentation:

#### Core Components:
- **Neural Processing Engine**: Advanced transformer networks with custom attention
- **Geometry Generation Pipeline**: Mesh generation, topology optimization, UV mapping
- **Texture Synthesis System**: Material synthesis, PBR texture generation
- **Material Processing Unit**: Advanced material handling
- **Rendering Optimization Layer**: Performance optimization

#### Processing Pipeline:
- **Geometry Processing**: 
  - Mesh generation algorithms
  - Topology optimization
  - UV mapping automation
  - LOD (Level of Detail) generation
  - Normal calculation
- **Texture Processing**:
  - Material synthesis
  - PBR texture generation
  - Resolution optimization
  - Texture atlas management
  - Compression algorithms

#### Performance Features:
- **Hardware Acceleration**: GPU optimization, multi-threading, memory management
- **Software Optimization**: Code efficiency, resource allocation, caching
- **Scalability**: Distributed processing, load balancing

---

## Proposed New Tools for RenderIQ

Based on Hunyuan3D-2.5 capabilities, here are new tools to add to the `/apps` registry:

### Tool 1: Image to 3D Model
- **Slug**: `image-to-3d`
- **Category**: `3d`
- **Input**: Single image or multiple views
- **Output**: 3D mesh (GLB/OBJ format)
- **Use Case**: Convert architectural renders, sketches, or photos into 3D models
- **System Prompt**: "Generate a high-quality 3D mesh from this architectural image, preserving geometric accuracy and structural details"

### Tool 2: Text to 3D Model
- **Slug**: `text-to-3d`
- **Category**: `3d`
- **Input**: Text description
- **Output**: 3D mesh (GLB/OBJ format)
- **Use Case**: Generate 3D architectural elements from descriptions (e.g., "modern chair", "glass table")
- **System Prompt**: "Generate a 3D architectural model based on this description, ensuring realistic proportions and architectural accuracy"

### Tool 3: 3D Model Texture Generator
- **Slug**: `3d-texture-generator`
- **Category**: `3d`
- **Input**: 3D mesh + reference image
- **Output**: Textured 3D model
- **Use Case**: Apply realistic textures to 3D architectural models
- **System Prompt**: "Apply realistic architectural textures to this 3D model based on the reference image, maintaining material accuracy"

### Tool 4: Multi-View to 3D
- **Slug**: `multiview-to-3d`
- **Category**: `3d`
- **Input**: Multiple images from different angles
- **Output**: 3D mesh (GLB/OBJ format)
- **Use Case**: Reconstruct 3D models from architectural photo sets
- **System Prompt**: "Generate a precise 3D reconstruction from these multi-view architectural images, ensuring consistency across views"

---

## Integration Architecture

### Option 1: Hunyuan3D AI API (Recommended for MVP)

**Use Official Hunyuan3D AI API Service:**

Hunyuan3D provides a Python SDK and REST API for cloud-based 3D generation. This is the easiest integration path:

**Python SDK Usage:**
```python
# lib/services/hunyuan3d-service.py
import hunyuan3d
import os

class Hunyuan3DService:
    def __init__(self):
        self.client = hunyuan3d.Client(
            api_key=os.getenv('HUNYUAN3D_API_KEY'),
            environment="production"
        )
        # Configure API settings
        self.client.configure(
            max_retries=3,
            timeout=300,
            verbose=True
        )
    
    def generate_from_text(self, prompt: str, style: str = "realistic", 
                          format: str = "glb", **params):
        """Generate 3D model from text prompt"""
        return self.client.generate(
            prompt=prompt,
            style=style,
            format=format,
            parameters={
                "polygon_count": params.get("polygon_count", 10000),
                "texture_resolution": params.get("texture_resolution", 2048),
                "optimization_level": params.get("optimization_level", "high"),
                **params
            }
        )
    
    def generate_from_image(self, image_url: str, **params):
        """Generate 3D model from image (if supported)"""
        # Check API docs for image-to-3D endpoint
        return self.client.generate(
            image=image_url,
            **params
        )
    
    def batch_generate(self, prompts: list):
        """Generate multiple models efficiently"""
        return self.client.batch_generate(prompts)
    
    def modify_model(self, model_id: str, modifications: dict):
        """Modify existing 3D model"""
        return self.client.modify(
            model_id=model_id,
            modifications=modifications
        )
```

**Next.js Integration (via API Route):**
```typescript
// lib/services/hunyuan3d-api.ts
// Wrapper to call Python service or REST API directly

export class Hunyuan3DAPIService {
  private apiKey: string;
  private baseUrl: process.env.HUNYUAN3D_API_URL || 'https://api.hunyuan3d.ai';

  async generate3DFromText(prompt: string, options: {
    style?: string;
    format?: 'glb' | 'obj';
    polygonCount?: number;
    textureResolution?: number;
  }) {
    // Option A: Call Python service internally
    // Option B: Call REST API directly (if available)
    const response = await fetch(`${this.baseUrl}/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: options.style || 'realistic',
        format: options.format || 'glb',
        parameters: {
          polygon_count: options.polygonCount || 10000,
          texture_resolution: options.textureResolution || 2048,
          optimization_level: 'high',
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generate3DFromImage(imageUrl: string, options: {
    style?: string;
    format?: 'glb' | 'obj';
  }) {
    // Similar implementation for image-to-3D
    // Verify endpoint from official docs
  }
}
```

**Benefits:**
- ✅ No infrastructure management
- ✅ No GPU server setup required
- ✅ Automatic scaling
- ✅ Python SDK for easy integration
- ✅ Batch processing support
- ✅ Model modification capabilities
- ✅ Progress tracking (async support)

**Limitations:**
- ❌ Requires API key from Hunyuan3D
- ❌ API rate limits (need to implement rate limiting)
- ❌ Ongoing costs per generation
- ❌ Need to verify image-to-3D support in API

### Option 2: Self-Hosted API Server (Open-Source Models)

**Self-host Hunyuan3D-2.0 or 2.1 (confirmed open-source):**

**Standard Installation:**
```bash
# On GCP GPU instance (e.g., n1-standard-4 with T4 or L4 GPU)
git clone https://github.com/Tencent-Hunyuan/Hunyuan3D-2.git
cd Hunyuan3D-2

# Install dependencies (Python 3.10+)
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu124
pip install -r requirements.txt
pip install -e .

# Compile custom components
cd hy3dgen/texgen/custom_rasterizer
python setup.py install
cd ../differentiable_renderer
bash compile_mesh_painter.sh
cd ../../..

# Download models from HuggingFace
huggingface-cli download tencent/Hunyuan3D-2

# Launch API server (if api_server.py exists, otherwise use gradio_app.py)
python api_server.py --host 0.0.0.0 --port 8080
# OR use Gradio app and wrap it with an API
python gradio_app.py --model_path tencent/Hunyuan3D-2 --subfolder hunyuan3d-dit-v2-0-turbo
```

**Docker Deployment (Recommended):**
```bash
# Build Docker image
docker build -t hunyuan3d-server .

# Run container with GPU support
docker run --gpus all -p 8080:8080 \
  -e CUDA_VISIBLE_DEVICES=0 \
  -v /path/to/models:/models \
  -v /path/to/cache:/cache \
  hunyuan3d-server

# Docker Compose example
version: '3.8'
services:
  hunyuan3d:
    build: .
    ports:
      - "8080:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - MODEL_PATH=/models
      - CACHE_DIR=/cache
    volumes:
      - ./models:/models
      - ./cache:/cache
```

**GCP Deployment Example:**

```bash
# Create GCP VM with GPU
gcloud compute instances create hunyuan3d-server \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-t4-vws,count=1 \
  --image-family=pytorch-latest-gpu \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=200GB

# SSH and setup
gcloud compute ssh hunyuan3d-server --zone=us-central1-a
```

**Integration Flow:**
```
RenderIQ Frontend → Next.js API Route → Self-Hosted Hunyuan3D API → GPU Processing → Return 3D Model
```

**Benefits:**
- ✅ Full control over infrastructure
- ✅ No per-request API costs
- ✅ Can customize models
- ✅ Data privacy (models stay on your servers)

**Limitations:**
- ❌ Requires GPU infrastructure management
- ❌ Higher upfront costs
- ❌ May not have access to 2.5 (use 2.0/2.1)
- ❌ Need to handle scaling yourself

### Option 3: Direct Python Integration (Alternative)

**Using Python subprocess or Python service:**

```typescript
// lib/services/hunyuan3d-service.ts
import { spawn } from 'child_process';
import { writeFile, readFile } from 'fs/promises';

export class Hunyuan3DService {
  async imageTo3D(imageBuffer: Buffer, options: {
    model?: 'standard' | 'turbo' | 'mini';
    format?: 'glb' | 'obj';
  }) {
    // Call Python script via subprocess
    // Or use a Python HTTP service
  }
}
```

**Limitations:**
- ❌ Requires Python runtime in Next.js environment
- ❌ GPU access from Node.js is complex
- ❌ Slower deployment cycles

---

## Implementation Steps

### Phase 1: Infrastructure Setup

1. **Set up Hunyuan3D-2.5 API Server**
   ```bash
   # On GPU-enabled server (AWS/GCP/Azure)
   docker run -it --gpus all -p 8080:8080 hunyuan3d-server
   ```

2. **Create Next.js API Route**
   ```typescript
   // app/api/tools/3d/generate/route.ts
   export async function POST(request: Request) {
     // Forward request to Hunyuan3D API
     // Handle authentication & credits
     // Return 3D model URL
   }
   ```

3. **Add 3D Model Storage**
   - Upload GLB/OBJ files to S3/Cloud Storage
   - Store metadata in database
   - Create preview images/thumbnails

### Phase 2: Tool Registry Integration

**Add to `lib/tools/registry.ts`:**

```typescript
{
  id: 'image-to-3d',
  slug: 'image-to-3d',
  name: 'Image to 3D Model',
  description: 'Convert architectural images into detailed 3D models with AI',
  category: '3d',
  systemPrompt: 'Generate a high-quality 3D architectural model from this image',
  inputType: 'image',
  outputType: 'model', // NEW output type
  priority: 'high',
  status: 'offline', // Start as offline
  seo: {
    title: 'Image to 3D Model | AI 3D Generation Tool',
    description: 'Convert architectural images to 3D models using AI',
    keywords: ['image to 3d', '3d model generator', 'AI 3D conversion']
  }
}
```

**Update `ToolConfig` interface:**
```typescript
export interface ToolConfig {
  // ... existing fields
  outputType: 'image' | 'video' | 'model'; // Add 'model'
}
```

### Phase 3: UI Components

**Create 3D-specific tool component:**

```typescript
// components/tools/tools/image-to-3d.tsx
'use client';

export function ImageTo3DTool({ tool, projectId }) {
  // Upload interface for images
  // Model selection (standard/turbo/mini)
  // Preview 3D model viewer
  // Download options (GLB/OBJ)
}
```

**3D Model Viewer:**
```typescript
// components/tools/3d-model-viewer.tsx
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

export function ModelViewer({ modelUrl }) {
  // Use Three.js or react-three-fiber
  // Display GLB/OBJ models
  // Interactive controls (rotate, zoom)
}
```

### Phase 4: Backend Integration

**Update render service:**

```typescript
// lib/services/render.ts
async create3DModel(toolId: string, inputData: {
  imageUrl?: string;
  textPrompt?: string;
  modelVariant?: string;
}) {
  // 1. Validate inputs
  // 2. Check credits
  // 3. Call Hunyuan3D API
  // 4. Upload result to storage
  // 5. Create render record
  // 6. Deduct credits
}
```

**Database schema updates:**

```sql
-- Add 3D model fields to renders table
ALTER TABLE renders ADD COLUMN model_url TEXT;
ALTER TABLE renders ADD COLUMN model_format VARCHAR(10); -- 'glb' | 'obj'
ALTER TABLE renders ADD COLUMN model_metadata JSONB;
```

---

## Best Practices (From Official API Docs)

### Rate Limiting
Implement proper rate limiting to avoid hitting API limits:

```python
from ratelimit import limits, sleep_and_retry
from functools import wraps

@sleep_and_retry
@limits(calls=100, period=60)  # 100 calls per 60 seconds
def rate_limited_generate(client, prompt):
    return client.generate(prompt=prompt)
```

```typescript
// TypeScript/Next.js rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60s'),
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
}
```

### Error Handling
Implement robust error handling:

```python
try:
    model = client.generate(prompt="complex scene")
except hunyuan3d.APIError as e:
    logger.error(f"API Error: {e.message}")
    # Handle API errors (rate limits, server errors, etc.)
except hunyuan3d.ValidationError as e:
    logger.error(f"Validation Error: {e.details}")
    # Handle validation errors (invalid prompts, parameters, etc.)
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
```

```typescript
// TypeScript error handling
try {
  const result = await hunyuan3d.generate3DFromText(prompt);
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded - retry with backoff
  } else if (error.response?.status >= 500) {
    // Server error - retry
  } else {
    // Client error - don't retry
  }
}
```

### Caching Strategy
Implement efficient caching for common requests:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_generate(prompt: str, style: str):
    return client.generate(prompt=prompt, style=style)
```

```typescript
// Redis caching in Next.js
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedModel(prompt: string, style: string) {
  const cacheKey = `hunyuan3d:${prompt}:${style}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  const result = await generateModel(prompt, style);
  await redis.set(cacheKey, result, { ex: 3600 }); // Cache for 1 hour
  return result;
}
```

### Resource Management
Configure resource limits:

```python
# Configure resource limits
client.set_resource_limits(
    max_concurrent_requests=5,
    max_memory_usage="4GB",
    cleanup_interval=300
)
```

### API Key Security
Secure handling of API credentials:

```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('HUNYUAN3D_API_KEY')
client = hunyuan3d.Client(api_key=api_key)
```

```typescript
// Environment variables in Next.js
const apiKey = process.env.HUNYUAN3D_API_KEY;
if (!apiKey) {
  throw new Error('HUNYUAN3D_API_KEY not configured');
}
```

### Request Validation
Implement input validation:

```python
def validate_request(prompt: str, parameters: dict):
    if not isinstance(prompt, str):
        raise ValueError("Prompt must be a string")
    if len(prompt) > 1000:
        raise ValueError("Prompt too long (max 1000 characters)")
    if len(prompt) < 3:
        raise ValueError("Prompt too short (min 3 characters)")
    # Additional validation logic
```

### Monitoring and Analytics
Track API usage and performance:

```python
# Initialize monitoring
metrics = client.init_metrics()

# Track API calls
with metrics.track_request():
    model = client.generate(prompt="test model")

# Get analytics
analytics = client.get_analytics()
print(f"Total requests: {analytics.total_requests}")
print(f"Average response time: {analytics.avg_response_time}ms")
```

---

## Technical Architecture Details

### System Architecture
Based on official documentation, Hunyuan3D AI uses a multi-tiered architecture:

1. **Neural Processing Engine**:
   - Advanced transformer networks
   - Custom attention mechanisms
   - Specialized 3D convolutions
   - Adaptive learning systems
   - Multi-modal processing

2. **Geometry Generation Pipeline**:
   - Mesh generation algorithms
   - Topology optimization
   - UV mapping automation
   - LOD (Level of Detail) generation
   - Normal calculation

3. **Texture Synthesis System**:
   - Material synthesis
   - PBR texture generation
   - Resolution optimization
   - Texture atlas management
   - Compression algorithms

4. **Performance Optimization**:
   - GPU acceleration with optimization
   - Multi-threading support
   - Memory management
   - Cache optimization
   - Load balancing

5. **Deployment Options**:
   - Local deployment with system requirements
   - Container deployment (Docker)
   - API-based cloud service
   - Integration APIs (Blender, ComfyUI)

### Security Implementation
- **Data Protection**: Encryption protocols, access control, audit logging
- **System Security**: Authentication, authorization, rate limiting, vulnerability scanning
- **API Security**: API key management, request validation, secure transmission

### Performance Metrics
- **Generation Speed**: Optimized for fast inference
- **Memory Usage**: Efficient resource management
- **Scalability**: Distributed processing support
- **Reliability**: Error handling and recovery procedures

## Technical Considerations

### 1. **GPU Requirements**
- Hunyuan3D requires GPU for inference
- **Minimum**: NVIDIA GPU with 8GB VRAM (for mini/turbo models)
- **Recommended**: 16GB+ VRAM (NVIDIA RTX 4090, A100, etc.) for full quality
- **GCP GPU Options**:
  - `n1-standard-4` with NVIDIA T4 (16GB VRAM) - ~$0.35/hour
  - `n1-standard-8` with NVIDIA L4 (24GB VRAM) - Better performance
  - `a2-highgpu-1g` with A100 (40GB VRAM) - Best performance

### 2. **Processing Time**
- Image-to-3D (turbo): ~10-20 seconds
- Image-to-3D (standard): ~30-60 seconds
- Text-to-3D: ~60-120 seconds
- Texture generation: ~20-40 seconds
- **Solution**: Async processing with status updates, job queuing

### 3. **File Sizes**
- 3D models (GLB): 5-50MB typically
- Need efficient storage and CDN for delivery
- Generate thumbnails/previews for gallery

### 4. **Credits/Billing**
- 3D generation is more compute-intensive
- Suggest: 5-10 credits per generation (vs 1-2 for images)
- Update credit packages to reflect 3D generation costs

### 5. **Model Variants & Performance**
- `mini`: Fastest, lowest quality (good for previews)
- `standard`: Balanced quality/speed (default)
- `turbo`: Fast inference with step/guidance distillation
- `full`: Highest quality, slowest

### 6. **System Requirements**
#### For API Usage (Cloud):
- No local requirements (handled by Hunyuan3D AI infrastructure)
- Internet connection for API calls

#### For Self-Hosting:
- **GPU**: NVIDIA GPU with 8GB+ VRAM (16GB+ recommended)
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: 16GB+ system RAM
- **Storage**: 50GB+ for models and dependencies
- **OS**: Linux (Ubuntu 20.04+), Windows 10+, or macOS
- **Python**: Python 3.10+
- **CUDA**: CUDA 11.8+ for GPU acceleration

---

## API Integration Example

**Hunyuan3D AI API Endpoints:**

**Text-to-3D Generation:**
```python
import hunyuan3d

client = hunyuan3d.Client(api_key="your_api_key")

# Generate 3D model from text
response = client.generate(
    prompt="modern office chair",
    style="realistic",
    format="glb",
    parameters={
        "polygon_count": 10000,
        "texture_resolution": 2048,
        "optimization_level": "high"
    }
)

# Response structure
{
    "model_id": "model_xyz",
    "model_url": "https://storage.../model.glb",
    "preview_url": "https://storage.../preview.png",
    "metadata": {
        "vertices": 12345,
        "faces": 9876,
        "format": "glb",
        "processing_time": 45.2
    }
}
```

**Image-to-3D (verify support):**
```python
# Check API docs for image input support
response = client.generate(
    image="https://your-image-url.com/image.jpg",
    # or image_path="/path/to/image.png",
    style="realistic",
    format="glb"
)
```

**Batch Processing:**
```python
results = client.batch_generate([
    {"prompt": "vintage lamp", "style": "art_deco"},
    {"prompt": "modern sofa", "style": "minimalist"},
    {"prompt": "wooden table", "style": "rustic"}
])
```

**Model Modification:**
```python
modified_model = client.modify(
    model_id="model_xyz",
    modifications={
        "scale": 1.5,
        "rotation": [0, 90, 0],
        "material": "metal"
    }
)
```

**Async/Progress Tracking:**
```python
# Stream generation progress
async for progress in client.generate_with_progress(
    prompt="detailed car model",
    style="realistic"
):
    print(f"Progress: {progress.percentage}%")
```

**REST API (if available):**
```bash
POST https://api.hunyuan3d.ai/v1/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "prompt": "modern office chair",
  "style": "realistic",
  "format": "glb",
  "parameters": {
    "polygon_count": 10000,
    "texture_resolution": 2048,
    "optimization_level": "high"
  }
}
```

**Error Handling:**
```python
try:
    model = client.generate(prompt="complex scene")
except hunyuan3d.APIError as e:
    logger.error(f"API Error: {e.message}")
except hunyuan3d.ValidationError as e:
    logger.error(f"Validation Error: {e.details}")
```

**Next.js API Route Wrapper (Hunyuan3D AI API):**
```typescript
// app/api/tools/3d/generate/route.ts
import { createRenderAction } from '@/lib/actions/render.actions';
import { Hunyuan3DAPIService } from '@/lib/services/hunyuan3d-api';
import { spawn } from 'child_process';
import { promisify } from 'util';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const toolId = formData.get('toolId') as string;
    const prompt = formData.get('prompt') as string;
    const imageUrl = formData.get('imageUrl') as string | null;
    const style = formData.get('style') as string || 'realistic';
    const format = (formData.get('format') as 'glb' | 'obj') || 'glb';
    
    // Validate user & credits
    const userId = formData.get('userId') as string;
    // ... credit validation ...
    
    const hunyuan3d = new Hunyuan3DAPIService();
    
    let result;
    if (imageUrl) {
      // Image-to-3D (verify API support)
      result = await hunyuan3d.generate3DFromImage(imageUrl, {
        style,
        format,
      });
    } else {
      // Text-to-3D
      result = await hunyuan3d.generate3DFromText(prompt, {
        style,
        format,
        polygonCount: 10000,
        textureResolution: 2048,
      });
    }
    
    // Download model from result.model_url
    const modelResponse = await fetch(result.model_url);
    const modelBuffer = await modelResponse.arrayBuffer();
    
    // Upload to your storage (GCS/S3)
    const storageService = new StorageService();
    const modelKey = await storageService.upload3DModel(
      Buffer.from(modelBuffer),
      `${toolId}/${result.model_id}.${format}`,
      format
    );
    
    // Create render record with model URL
    const render = await RendersDAL.create({
      projectId: formData.get('projectId') as string,
      userId,
      type: 'model', // New type
      prompt,
      settings: { style, format },
      modelUrl: storageService.getPublicUrl(modelKey),
      modelFormat: format,
      status: 'completed',
      // ... other fields
    });
    
    // Deduct credits
    await deductCredits(userId, 5); // Adjust based on pricing
    
    return Response.json({ success: true, data: render });
  } catch (error) {
    if (error instanceof hunyuan3d.APIError) {
      return Response.json(
        { success: false, error: `API Error: ${error.message}` },
        { status: 500 }
      );
    }
    throw error;
  }
}
```

**Alternative: Python Service Integration:**
```typescript
// If using Python SDK, call via subprocess or Python HTTP service
async function callPythonService(method: string, params: any) {
  // Option 1: Call Python script via subprocess
  const { stdout } = await promisify(exec)(
    `python lib/services/hunyuan3d-service.py ${method} ${JSON.stringify(params)}`
  );
  return JSON.parse(stdout);
  
  // Option 2: Run Python HTTP service and call it
  const response = await fetch('http://localhost:8000/api/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response.json();
}
```

**Next.js API Route (Self-Hosted):**
```typescript
// app/api/tools/3d/generate/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  
  // Validate user & credits
  // Call self-hosted API
  const response = await fetch(`${process.env.HUNYUAN3D_API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: formData.get('image'), // base64 or URL
      model: formData.get('modelVariant') || 'hunyuan3d-dit-v2-0-turbo',
      format: 'glb',
    }),
  });
  
  const result = await response.json();
  
  // Upload to storage
  // Create render record
  // Return result
}
```

---

## Recommended Implementation Order

### Phase 1: Research & Planning (Week 1)
- ✅ Verify Hunyuan3D Studio API availability and pricing
- ✅ Decide: Self-hosted (2.0/2.1) vs Cloud API (Studio)
- ✅ Test API access or set up GCP GPU instance
- ✅ Review official documentation and examples

1. **Week 2-3: Infrastructure Setup**
   - **Option A**: Get Hunyuan3D Studio API key and test integration
   - **Option B**: Set up self-hosted Hunyuan3D-2.0/2.1 on GCP GPU instance
   - Create Next.js API routes for 3D generation
   - Set up 3D model storage (GCS/S3 bucket)

2. **Week 3: Tool Registry**
   - Add 3D tools to registry
   - Update ToolConfig interface for 'model' output type
   - Create tool pages at `/apps/image-to-3d`, etc.

3. **Week 4: UI Components**
   - Build 3D model upload interface
   - Create 3D model viewer component
   - Add model download functionality

4. **Week 5: Integration**
   - Connect to render service
   - Update credit system for 3D generation
   - Add error handling and status updates

5. **Week 6: Testing & Launch**
   - Beta testing with select users
   - Performance optimization
   - Documentation and tutorials

---

## Cost Considerations

### API Costs (Hunyuan3D AI API)
- **Check official pricing**: Verify with Hunyuan3D for current pricing
- **Typical model**: Pay-per-generation or subscription-based
- **Factors affecting cost**:
  - Model complexity (polygon count)
  - Texture resolution
  - Generation speed (standard vs turbo)
  - Batch processing discounts (if available)

### Self-Hosted Infrastructure Costs
- **GPU Server**: $0.50-$2.00/hour (depending on GPU)
  - AWS g4dn.xlarge: ~$0.52/hour
  - GCP n1-standard-4 + T4: ~$0.35/hour
  - GCP n1-standard-8 + L4: ~$0.60/hour (better performance)
- **Storage**: ~$0.023/GB/month (GCS/S3 standard)
- **Bandwidth**: ~$0.09/GB (data transfer out)

### Credit Pricing (RenderIQ)
- Suggested pricing (adjust based on API costs):
  - Text-to-3D (standard): 5-8 credits
  - Text-to-3D (high quality): 10-15 credits
  - Image-to-3D: 8-12 credits (if supported)
  - Model modification: 2-3 credits
  - Batch generation: Discounted rates

---

## Architecture Integration Points

### Processing Pipeline Integration
When integrating with RenderIQ, consider these pipeline stages:

1. **Input Processing**:
   - Validate prompts/images
   - Preprocess images (resize, normalize)
   - Generate optimization parameters based on use case

2. **Generation**:
   - Queue management for API calls
   - Progress tracking for async operations
   - Error handling and retries

3. **Post-Processing**:
   - Model optimization (LOD generation)
   - Texture compression
   - Format conversion (GLB/OBJ/FBX)
   - Preview generation

4. **Storage & Delivery**:
   - Upload to cloud storage (GCS/S3)
   - Generate CDN-optimized URLs
   - Create thumbnails/previews
   - Metadata indexing

### Performance Optimization Strategies

#### Caching Strategy:
```python
# Cache generated models by prompt signature
@lru_cache(maxsize=100)
def get_cached_model(prompt_hash: str, style: str, format: str):
    # Check if model exists in cache
    # Return cached model URL if available
    pass
```

#### Batch Processing:
```python
# Process multiple requests in batch
async def batch_process_requests(requests: list):
    results = await client.batch_generate([
        {"prompt": req.prompt, "style": req.style}
        for req in requests
    ])
    return results
```

#### Load Balancing:
- Use multiple API keys/endpoints if available
- Implement request queuing
- Distribute load across instances

## Future Enhancements

1. **Batch Processing**: ✅ Already supported via `batch_generate()` API
2. **3D Gallery**: Browse and explore 3D models in RenderIQ
3. **AR/VR Preview**: View models in AR/VR using WebXR
4. **Model Editing**: Basic mesh editing within RenderIQ UI
5. **Integration with Render Pipeline**: Use 3D models as input for 2D renders
6. **Multi-View Generation**: Generate multiple views from single 3D model
7. **Real-time Preview**: Stream generation progress to users
8. **Model Marketplace**: Share and sell 3D models
9. **Custom Training**: Fine-tune models on architectural datasets
10. **Format Conversion**: Automatic conversion between GLB/OBJ/FBX formats

## Architecture Integration Points

### Processing Pipeline Integration
When integrating with RenderIQ, consider these pipeline stages:

1. **Input Processing**:
   - Validate prompts/images
   - Preprocess images (resize, normalize)
   - Generate optimization parameters based on use case

2. **Generation**:
   - Queue management for API calls
   - Progress tracking for async operations
   - Error handling and retries

3. **Post-Processing**:
   - Model optimization (LOD generation)
   - Texture compression
   - Format conversion (GLB/OBJ/FBX)
   - Preview generation

4. **Storage & Delivery**:
   - Upload to cloud storage (GCS/S3)
   - Generate CDN-optimized URLs
   - Create thumbnails/previews
   - Metadata indexing

### Performance Optimization Strategies

#### Caching Strategy:
```python
# Cache generated models by prompt signature
@lru_cache(maxsize=100)
def get_cached_model(prompt_hash: str, style: str, format: str):
    # Check if model exists in cache
    # Return cached model URL if available
    pass
```

#### Batch Processing:
```python
# Process multiple requests in batch
async def batch_process_requests(requests: list):
    results = await client.batch_generate([
        {"prompt": req.prompt, "style": req.style}
        for req in requests
    ])
    return results
```

#### Load Balancing:
- Use multiple API keys/endpoints if available
- Implement request queuing
- Distribute load across instances
7. **Real-time Preview**: Stream generation progress to users
8. **Model Marketplace**: Share and sell 3D models
9. **Custom Training**: Fine-tune models on architectural datasets
10. **Format Conversion**: Automatic conversion between GLB/OBJ/FBX formats

---

## Resources & Documentation

### Official Resources
- **Official API Documentation**: Hunyuan3D AI API Developer's Guide (provided)
- **Technical Architecture**: Hunyuan3D AI Technical Architecture Deep Dive (provided)
- **Official GitHub Repo**: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- **Hunyuan3D Studio (Web Platform)**: https://3d.hunyuan.tencent.com/
- **Model Weights (HuggingFace)**: https://huggingface.co/tencent/Hunyuan3D-2
- **ReadTheDocs**: https://hunyuan3d-2.readthedocs.io/
- **Docker Deployment Guide**: Check official documentation
- **Installation Guide**: See GitHub repository
- **Performance Benchmarks**: Check technical architecture docs
- **Research Papers**:
  - Hunyuan3D 2.5: https://arxiv.org/abs/2506.16504
  - Hunyuan3D 2.0: https://arxiv.org/abs/2501.12202
  - Hunyuan3D 1.0: https://arxiv.org/abs/2411.02293

### API Key & Access
- **Sign up**: Register at Hunyuan3D Studio or contact for API access
- **API Key Management**: Store securely in environment variables
- **Rate Limiting**: Implement proper rate limiting (100 calls/60s suggested)
- **Error Handling**: Use provided exception types (APIError, ValidationError)

### Community Integrations
- **Blender Addon**: https://github.com/jfranmatheu/Hunyuan3DBlenderBridge
- **ComfyUI Nodes**: Community-developed nodes for ComfyUI workflows
- **Example Implementations**: Check GitHub for community projects

### Important Notes
- **API Availability**: Hunyuan3D AI API is available (Python SDK confirmed)
- **Image-to-3D**: Verify if API supports image input in current version
- **Open-Source Models**: Hunyuan3D-2.0 and 2.1 are open-source for self-hosting
- **Regional Restrictions**: Check current availability for your region
- **Rate Limits**: Implement proper rate limiting and retry logic

---

## Next Steps & Verification Required

### Critical: Verify Before Implementation

1. **Get Hunyuan3D AI API Access**:
   - ✅ **API Documentation Available**: Hunyuan3D AI API Developer's Guide provided
   - Sign up for API access at Hunyuan3D Studio or contact for API key
   - Verify API endpoint URLs and authentication method
   - Check pricing and rate limits (suggested: 100 calls/60s)
   - Test API key authentication

2. **Verify API Capabilities**:
   - ✅ Text-to-3D: Confirmed via `client.generate(prompt=...)`
   - ⚠️ Image-to-3D: Verify if API supports image input
   - ✅ Batch Processing: Available via `client.batch_generate()`
   - ✅ Model Modification: Available via `client.modify()`
   - ✅ Progress Tracking: Available via `client.generate_with_progress()`

3. **Install Python SDK**:
   ```bash
   pip install hunyuan3d
   # or check official installation instructions
   ```

4. **Test API Integration**:
   - Test basic text-to-3D generation
   - Verify error handling (APIError, ValidationError)
   - Test rate limiting implementation
   - Verify response format and model URL structure

5. **Verify Image-to-3D Support** (if needed):
   - Check if API supports image input in `generate()` method
   - Test with sample image if available
   - Consider using self-hosted solution if not available

6. **Review Self-Hosting Option** (if needed):
   - Check official GitHub: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
   - Verify if Hunyuan3D-2.0/2.1 meet requirements
   - Test GCP GPU setup if self-hosting

### Implementation Decision Tree

```
┌─────────────────────────────────────┐
│ Need Hunyuan3D Integration?         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼───┐    ┌───────▼──────┐
   │ Cloud │    │ Self-Hosted  │
   │ API   │    │ (Open-Source)│
   └───┬───┘    └───────┬──────┘
       │                │
   ┌───▼──────────┐ ┌───▼──────────────┐
   │ Check Studio │ │ Use Hunyuan3D-2.0│
   │ API Access   │ │ or 2.1 (verified │
   │ & Pricing    │ │ open-source)     │
   └──────────────┘ └──────────────────┘
```

### Recommended Action Plan

1. **Week 1: API Setup & Testing**
   - ✅ Get Hunyuan3D AI API key (sign up or contact)
   - ✅ Install Python SDK: `pip install hunyuan3d`
   - ✅ Test basic text-to-3D generation
   - ✅ Verify API response format and model URLs
   - ✅ Test error handling and rate limiting
   - ✅ Verify image-to-3D support (if needed)

2. **Week 2: Infrastructure Setup**
   - Create Python service wrapper (`lib/services/hunyuan3d-service.py`)
   - Create Next.js API routes (`app/api/tools/3d/generate/route.ts`)
   - Set up 3D model storage (GCS/S3 bucket)
   - Implement rate limiting middleware
   - Set up error handling and logging

3. **Week 3-4: Integration**
   - Add 3D tools to registry (`lib/tools/registry.ts`)
   - Update database schema for 3D models
   - Build UI components (upload, viewer, download)
   - Integrate with render service and credit system
   - Implement async processing with progress tracking

4. **Week 5: Testing & Optimization**
   - End-to-end testing
   - Performance optimization (caching, batch processing)
   - Rate limiting and queue management
   - Error handling improvements

5. **Week 6: Launch & Documentation**
   - Beta testing with select users
   - Documentation and tutorials
   - Monitoring and analytics setup
   - Launch announcement

---

**Status**: Needs verification before implementation  
**Estimated Timeline**: 6 weeks (after verification)  
**Priority**: High (unique differentiator for RenderIQ)  
**Blockers**: API availability verification, open-source status confirmation

