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
- Models:
  - `Hunyuan3D-Paint-v2-0`: Texture generation model (1.3B params)
  - `Hunyuan3D-Paint-v2-0-Turbo`: Distillation texture model

### 3. **Open-Source Status**
- ✅ **Hunyuan3D-2.0**: Fully open-source (code + weights on HuggingFace)
- ✅ **Hunyuan3D-2.1**: Fully open-source
- ⚠️ **Hunyuan3D-2.5**: May not be fully open-source yet (check GitHub issues)
- ✅ **Hunyuan3D Studio**: Web platform with API access (cloud service)

### 4. **Deployment Options**
- **Hunyuan3D Studio API**: Cloud service (easiest, requires API key)
- **Self-Hosted API Server**: Deploy on your own GPU infrastructure
- **Python API**: Diffusers-like interface (direct integration)
- **Gradio App**: Web UI interface (can be wrapped as API)
- **Blender Addon**: Community-developed (unofficial)

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

### Option 1: Hunyuan3D Studio API (Easiest - Recommended for MVP)

**Use Tencent's Official Cloud Service:**

Tencent provides Hunyuan3D Studio, a web-based platform with API access. This is the easiest integration path:

```typescript
// lib/services/hunyuan3d-api.ts
export class Hunyuan3DAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.hunyuan3d.tencent.com'; // Verify actual endpoint

  async generate3DFromImage(imageUrl: string, options: {
    model?: 'standard' | 'turbo';
    format?: 'glb' | 'obj';
  }) {
    const response = await fetch(`${this.baseUrl}/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_type: 'image',
        image_url: imageUrl,
        model: options.model || 'standard',
        output_format: options.format || 'glb',
      }),
    });
    return response.json();
  }
}
```

**Benefits:**
- ✅ No infrastructure management
- ✅ No GPU server setup
- ✅ Automatic scaling
- ✅ Latest models (including 2.5)
- ✅ Pay-per-use pricing

**Limitations:**
- ❌ Requires API key from Tencent
- ❌ Potential API rate limits
- ❌ Ongoing costs per generation
- ❌ Regional restrictions (not available in EU/UK/South Korea yet)

### Option 2: Self-Hosted API Server (Open-Source Models)

**Self-host Hunyuan3D-2.0 or 2.1 (confirmed open-source):**

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

### 5. **Model Variants**
- `mini`: Fastest, lowest quality (good for previews)
- `standard`: Balanced quality/speed (default)
- `turbo`: Fast inference with slightly reduced quality
- `full`: Highest quality, slowest

---

## API Integration Example

**Self-Hosted API Server Endpoint (if api_server.py exists):**
```bash
POST http://hunyuan3d-server:8080/generate
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "model": "hunyuan3d-dit-v2-0-turbo",
  "format": "glb"
}
```

**Hunyuan3D Studio API (Tencent Cloud - verify actual endpoint):**
```bash
POST https://api.hunyuan3d.tencent.com/v1/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "input_type": "image",
  "image_url": "https://your-image-url.com/image.jpg",
  "model": "standard",  # or "turbo"
  "output_format": "glb"
}
```

**Response (Typical):**
```json
{
  "status": "success",
  "job_id": "job_123456",
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

**Note**: The actual API structure may vary. Check:
- Official Tencent documentation for Hunyuan3D Studio API
- GitHub repo's `api_server.py` or `examples/` folder for implementation details
- Community integrations like Blender addon for API usage examples

**Next.js API Route Wrapper (Hunyuan3D Studio API):**
```typescript
// app/api/tools/3d/generate/route.ts
import { createRenderAction } from '@/lib/actions/render.actions';
import { Hunyuan3DAPIService } from '@/lib/services/hunyuan3d-api';

export async function POST(request: Request) {
  const formData = await request.formData();
  const toolId = formData.get('toolId');
  const imageUrl = formData.get('imageUrl') as string;
  
  // Validate user & credits
  const hunyuan3d = new Hunyuan3DAPIService();
  
  // Call Hunyuan3D Studio API
  const result = await hunyuan3d.generate3DFromImage(imageUrl, {
    model: (formData.get('modelVariant') as 'standard' | 'turbo') || 'turbo',
    format: 'glb',
  });
  
  // Download model from result.model_url
  // Upload to your storage (GCS/S3)
  // Create render record
  // Return result
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

### Infrastructure Costs
- **GPU Server**: $0.50-$2.00/hour (depending on GPU)
  - AWS g4dn.xlarge: ~$0.52/hour
  - GCP n1-standard-4 + T4: ~$0.35/hour
- **Storage**: ~$0.023/GB/month (S3 standard)
- **Bandwidth**: ~$0.09/GB (data transfer out)

### Credit Pricing
- Suggested pricing:
  - Image-to-3D (turbo): 3 credits
  - Image-to-3D (standard): 5 credits
  - Text-to-3D: 8 credits
  - Texture generation: 2 credits

---

## Future Enhancements

1. **Batch Processing**: Generate multiple 3D models at once
2. **3D Gallery**: Browse and explore 3D models
3. **AR/VR Preview**: View models in AR/VR
4. **Model Editing**: Basic mesh editing within RenderIQ
5. **Integration with Render Pipeline**: Use 3D models as input for renders
6. **Multi-View Generation**: Generate multiple views from single 3D model

---

## Resources & Documentation

### Official Resources
- **Official GitHub Repo**: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- **Hunyuan3D Studio (Web Platform)**: https://3d.hunyuan.tencent.com/
- **Model Weights (HuggingFace)**: https://huggingface.co/tencent/Hunyuan3D-2
- **ReadTheDocs**: https://hunyuan3d-2.readthedocs.io/
- **Research Papers**:
  - Hunyuan3D 2.5: https://arxiv.org/abs/2506.16504
  - Hunyuan3D 2.0: https://arxiv.org/abs/2501.12202
  - Hunyuan3D 1.0: https://arxiv.org/abs/2411.02293

### Community Integrations
- **Blender Addon**: https://github.com/jfranmatheu/Hunyuan3DBlenderBridge
- **ComfyUI Nodes**: Community-developed nodes for ComfyUI workflows
- **Example Implementations**: Check GitHub for community projects

### Important Notes
- **Open-Source Status**: Hunyuan3D-2.0 and 2.1 are confirmed open-source. Verify 2.5 status on GitHub.
- **Regional Restrictions**: Hunyuan3D-2.5 not available in EU/UK/South Korea yet (licensing)
- **API Access**: Check Tencent documentation for Hunyuan3D Studio API access and pricing

---

## Next Steps & Verification Required

### Critical: Verify Before Implementation

1. **Check Hunyuan3D Studio API**:
   - Visit https://3d.hunyuan.tencent.com/ and check for API access
   - Verify API endpoint URLs and authentication method
   - Check pricing and rate limits
   - Confirm if API is available in your region

2. **Verify Open-Source Status**:
   - Check official GitHub: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
   - Verify if Hunyuan3D-2.5 is fully open-source or requires API access
   - Check GitHub issues/discussions for open-source roadmap

3. **Review Official Documentation**:
   - Read official README and docs in the GitHub repo
   - Check for `api_server.py` or API examples
   - Review `examples/` folder for usage patterns
   - Check ReadTheDocs: https://hunyuan3d-2.readthedocs.io/

4. **Test API Server (if self-hosting)**:
   - Clone official repo (not fork)
   - Test Gradio app or API server locally
   - Verify model download from HuggingFace works
   - Test GCP GPU setup with actual inference

5. **Study Community Integrations**:
   - Review Blender addon code: https://github.com/jfranmatheu/Hunyuan3DBlenderBridge
   - Check how it uses Hunyuan3D API (if any)
   - Look for API authentication patterns

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

1. **Week 1: Research & Verification**
   - ✅ Verify Hunyuan3D Studio API availability
   - ✅ Test API access (if available) or confirm self-hosting needed
   - ✅ Clone official repo and test locally
   - ✅ Review actual API structure from repo/examples

2. **Week 2-3: Infrastructure**
   - **If using Studio API**: Get API key, test integration
   - **If self-hosting**: Set up GCP GPU instance with Hunyuan3D-2.0/2.1
   - Create Next.js API routes
   - Set up 3D model storage

3. **Week 4-5: Implementation**
   - Add 3D tools to registry
   - Build UI components
   - Integrate with render service
   - Test end-to-end flow

4. **Week 6: Testing & Launch**
   - Beta testing
   - Performance optimization
   - Documentation

---

**Status**: Needs verification before implementation  
**Estimated Timeline**: 6 weeks (after verification)  
**Priority**: High (unique differentiator for RenderIQ)  
**Blockers**: API availability verification, open-source status confirmation

