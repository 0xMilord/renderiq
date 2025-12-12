# Technical Moat Implementation Plan - LLM-Focused Approach

**Date**: 2025-01-27  
**Strategy**: Use LLMs (especially vision models) for intelligent processing, not traditional CV pipelines  
**Goal**: Build 90% of technical moat using cost-effective AI models

---

## Executive Summary

Instead of building complex computer vision pipelines, we'll use **Google's vision models** to do the heavy lifting:
- **Cheap models** (Gemini 2.5 Flash/Flash-Lite) for analysis, filtering, prompt enhancement
- **Expensive models** (Gemini 3 Pro Image, Veo 3.1) only for final generation
- **Multi-stage filtering** to reduce costs
- **Vision models** to understand images and create enhanced prompts
- **Structured outputs** (JSON Schema) for guaranteed type-safe responses
- **Multi-turn chat API** for iterative refinement with automatic thought signature handling

**Key Insight**: Use a small vision model to analyze reference images + style references + user prompt → generate optimized final prompt for expensive image/video generation.

**Key Technologies**:
- ✅ **Structured Outputs**: Guaranteed JSON responses (no parsing errors)
- ✅ **Multi-Turn Chat**: Conversation context + thought signatures (automatic)
- ✅ **Vision Models**: Image understanding at $0.0003-0.001 per analysis
- ✅ **Image Generation**: Simple renders $0.04-0.05, Complex $0.14-0.25
- ✅ **Video Generation**: Fast $0.15/s, Standard $0.40/s (with same optimization pipeline)

---

## 🚀 EASIEST SOLUTION (Start Here)

**The simplest approach**: Use Gemini 2.5 Flash (vision) to create optimized prompts before generation.

### Implementation (3 Steps)

1. **Add vision support to AISDKService** (5 minutes)
2. **Create SimplePromptOptimizer** (30 minutes)
3. **Update render API** (10 minutes)

**Total Time**: ~45 minutes  
**Cost**: +$0.001 per render (negligible)  
**Quality**: Significantly better prompts = better outputs

**Note**: Same approach works for **video generation** too! See **"Video Generation: Same Multi-Stage Pipeline"** section below.

See **"Quick Start Implementation"** section below for code.

---

## Full Multi-Stage Pipeline (Advanced)

Once the simple solution works, you can add the full 7-stage pipeline:
1. Semantic Parsing
2. Image Understanding
3. Prompt Optimization
4. Model Routing
5. Image Generation
6. Validation
7. Memory Extraction

See detailed implementation below.

---

## Current Flow vs. Target Flow

### Current Flow (Simple Wrapper)

```
User Prompt + Reference Image + Style Reference
    ↓
Direct to generateContent()
    ↓
Gemini 3 Pro Image (expensive)
    ↓
Image Output
```

**Problems**:
- No prompt optimization
- No image understanding
- No constraint validation
- Expensive model for everything
- No multi-stage quality gates

---

### Target Flow (Full Technical Moat - LLM-Focused)

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                               │
│  • User Prompt                                               │
│  • Reference Image (optional)                                 │
│  • Style Reference Image (optional)                          │
│  • Tool Context (floor plan, elevation, etc.)               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         STAGE 1: SEMANTIC PARSING (Cheap Model)             │
│         Model: Gemini 2.5 Flash (Vision)                    │
│         Cost: ~$0.001 per request                            │
│                                                              │
│  • Analyze user prompt (design intent extraction)           │
│  • Extract structural inference                             │
│  • Identify material specifications                         │
│  • Detect AEC-specific requirements                         │
│                                                              │
│  Output: Structured DesignIntent object                     │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 2: IMAGE UNDERSTANDING (Cheap Vision Model)        │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per image                                   │
│                                                              │
│  If Reference Image exists:                                  │
│    • Analyze reference image                                 │
│    • Extract style codes, palette, geometry                 │
│    • Identify architectural elements                       │
│    • Detect perspective, lighting, materials                │
│                                                              │
│  If Style Reference exists:                                  │
│    • Analyze style reference                                │
│    • Extract style characteristics                          │
│    • Identify visual elements to transfer                    │
│                                                              │
│  Output: ImageAnalysis object                                │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 3: PROMPT OPTIMIZATION (Cheap Model)              │
│    Model: Gemini 2.5 Flash                                   │
│    Cost: ~$0.001 per request                                │
│                                                              │
│  Input:                                                      │
│    • DesignIntent (from Stage 1)                            │
│    • ImageAnalysis (from Stage 2)                           │
│    • Tool Context (floor plan, elevation, etc.)             │
│    • AEC Constraints (from constraint engine)              │
│                                                              │
│  Process:                                                    │
│    • Combine all inputs into optimized prompt               │
│    • Apply AEC-specific constraints                         │
│    • Add architectural reasoning                            │
│    • Include style/material continuity                      │
│                                                              │
│  Output: Optimized Final Prompt                              │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 4: MODEL ROUTING (Cheap Model)                    │
│    Model: Gemini 2.5 Flash                                   │
│    Cost: ~$0.0001 per request                               │
│                                                              │
│  • Analyze task complexity                                  │
│  • Select optimal model based on:                           │
│    - Task complexity (simple → Flash, complex → Pro)       │
│    - Quality requirements (standard → Flash, ultra → Pro)  │
│    - AEC-specific needs (CAD → Pro, simple render → Flash)  │
│                                                              │
│  Output: Selected Model ID                                  │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 5: IMAGE GENERATION (Expensive Model)             │
│    Model: Gemini 3 Pro Image / Gemini 2.5 Flash Image       │
│    Cost: ~$0.05-0.20 per image (depending on model)        │
│                                                              │
│  Input:                                                      │
│    • Optimized Final Prompt (from Stage 3)                  │
│    • Reference Image (if exists)                             │
│    • Style Reference (if exists)                            │
│    • Selected Model (from Stage 4)                           │
│                                                              │
│  Process:                                                    │
│    • Generate image with optimized prompt                   │
│    • Apply AEC constraints (via prompt)                     │
│                                                              │
│  Output: Generated Image                                     │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 6: VALIDATION (Cheap Vision Model)                │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per image                                  │
│                                                              │
│  • Validate perspective grid                                │
│  • Check proportions                                        │
│  • Verify architectural elements                            │
│  • Detect obvious errors                                    │
│                                                              │
│  If validation fails → Regenerate with corrections          │
│  If validation passes → Continue                            │
│                                                              │
│  Output: ValidationResult                                    │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 7: POST-PROCESSING ANALYSIS (Cheap Vision)        │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per image                                  │
│                                                              │
│  • Extract style codes                                      │
│  • Extract palette                                          │
│  • Extract geometry vectors                                 │
│  • Extract material embeddings                              │
│                                                              │
│  Output: PipelineMemory (for future consistency)            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL OUTPUT                              │
│  • Generated Image                                           │
│  • Pipeline Memory (style, palette, geometry, materials)    │
│  • Validation Results                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis (Based on Official Google Gemini API Pricing)

### Model Pricing Reference

#### Cheap Models (For Analysis & Processing)
- **Gemini 2.5 Flash** (Text/Image/Video input):
  - Input: $0.30 per 1M tokens (Free tier available)
  - Output: $2.50 per 1M tokens (Free tier available)
  - **Estimated cost per analysis**: ~$0.0003-0.001 (depends on input size)

- **Gemini 2.5 Flash-Lite** (Even cheaper):
  - Input: $0.10 per 1M tokens (Free tier available)
  - Output: $0.40 per 1M tokens (Free tier available)
  - **Estimated cost per analysis**: ~$0.0001-0.0003

#### Expensive Models (For Final Generation)
- **Gemini 3 Pro Image Preview**:
  - Input: $2.00 per 1M tokens (text/image)
  - Output: $120.00 per 1M tokens (images)
  - **1K/2K image**: $0.134 per image (1120 tokens)
  - **4K image**: $0.24 per image (2000 tokens)

- **Gemini 2.5 Flash Image**:
  - Input: $0.30 per 1M tokens (text/image)
  - Output: $0.039 per image (1290 tokens for up to 1024x1024px)

- **Gemini 3 Pro** (Text model, for complex reasoning):
  - Input: $2.00 per 1M tokens (≤200k), $4.00 (>200k)
  - Output: $12.00 per 1M tokens (≤200k), $18.00 (>200k)

### Current Approach (No Optimization)
- **Cost per render**: ~$0.134-0.24 (Gemini 3 Pro Image 2K/4K) or $0.039 (Flash Image)
- **No prompt optimization**: Wasted tokens, lower quality
- **No validation**: Errors require regeneration (2x cost)
- **No multi-turn optimization**: Each render is independent

### Target Approach (LLM-Focused Multi-Stage)
- **Stage 1 (Semantic Parsing)**: $0.0003-0.001 (Gemini 2.5 Flash-Lite/Flash)
- **Stage 2 (Image Understanding)**: $0.0003-0.001 per image (Gemini 2.5 Flash Vision)
- **Stage 3 (Prompt Optimization)**: $0.0003-0.001 (Gemini 2.5 Flash)
- **Stage 4 (Model Routing)**: $0.0001-0.0003 (Gemini 2.5 Flash-Lite)
- **Stage 5 (Image Generation)**: 
  - Simple: $0.039 (Gemini 2.5 Flash Image)
  - Complex: $0.134-0.24 (Gemini 3 Pro Image 2K/4K)
- **Stage 6 (Validation)**: $0.0003-0.001 (Gemini 2.5 Flash Vision)
- **Stage 7 (Post-Processing)**: $0.0003-0.001 (Gemini 2.5 Flash Vision)

**Total Cost**:
- **Simple renders**: ~$0.04-0.05 (Flash Image + analysis stages)
- **Complex renders**: ~$0.14-0.25 (Pro Image + analysis stages)
- **Current simple**: $0.039 (Flash Image, no optimization)
- **Current complex**: $0.134-0.24 (Pro Image, no optimization)

**Key Benefits**:
1. **Better quality** from optimized prompts
2. **Fewer regenerations** from validation
3. **Multi-turn consistency** via chat API (thought signatures)
4. **Cost-effective** for simple renders (use Flash Image)
5. **Pipeline memory** enables consistency across renders

**ROI**: Slight cost increase (~$0.01-0.02) but **massive quality improvement** and **fewer failed renders**.

---

## Key Google Gemini API Features We'll Use

### 1. Structured Outputs (JSON Schema)

**Why**: Guarantees type-safe, parseable responses. No more JSON parsing errors.

**Supported Models**:
- ✅ Gemini 3 Pro Preview
- ✅ Gemini 2.5 Pro
- ✅ Gemini 2.5 Flash
- ✅ Gemini 2.5 Flash-Lite

**Benefits**:
- **Guaranteed JSON compliance**: Model must return valid JSON matching your schema
- **Type safety**: Use Zod/Pydantic schemas for validation
- **No parsing errors**: Eliminates "Invalid JSON" exceptions
- **Better prompts**: Model understands exactly what structure you need

**Example Use Cases**:
- Semantic parsing (Stage 1) → `DesignIntent` schema
- Image analysis (Stage 2) → `ImageAnalysis` schema
- Model routing (Stage 4) → `ModelSelection` schema
- Validation (Stage 6) → `ValidationResult` schema

### 2. Multi-Turn Image Editing (Chat API)

**Why**: Maintains conversation context and thought signatures across iterations.

**Key Features**:
- **Conversation history**: Model remembers previous edits
- **Thought signatures**: Encrypted representations of reasoning (handled automatically by SDK)
- **Iterative refinement**: "Make it warmer" → "Add more contrast" → "Change the sofa color"
- **Consistency**: Better maintains style/character across turns

**Models**:
- **Gemini 3 Pro Image Preview**: Best for complex multi-turn editing
- **Gemini 2.5 Flash Image**: Faster, cheaper for simple edits

**Implementation**:
```typescript
// Create chat session (one-time per conversation)
const chat = await ai.chats.create({
  model: 'gemini-3-pro-image-preview',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: '16:9',
      imageSize: '2K'
    }
  }
});

// First message
let response = await chat.sendMessage({
  message: 'Create a modern living room with a blue sofa',
  config: {
    responseModalities: ['IMAGE']
  }
});

// Iterative edits (maintains context automatically)
response = await chat.sendMessage({
  message: 'Make the lighting warmer and add plants',
  config: {
    responseModalities: ['IMAGE'],
    imageConfig: {
      aspectRatio: '16:9',
      imageSize: '2K'
    }
  }
});

// Thought signatures are handled automatically by SDK
// No manual management needed!
```

**Benefits for Renderiq**:
- **Multi-turn consistency**: Users can refine renders conversationally
- **Style preservation**: Maintains architectural style across edits
- **Better UX**: Natural conversation flow vs. stateless requests

### 3. Vision Models for Image Understanding

**Models with Vision**:
- **Gemini 2.5 Flash**: $0.30/1M input tokens (text/image/video)
- **Gemini 2.5 Flash-Lite**: $0.10/1M input tokens (even cheaper)
- **Gemini 3 Pro**: $2.00/1M input tokens (for complex analysis)

**Capabilities**:
- Analyze reference images
- Extract style codes, palettes, geometry
- Understand architectural elements
- Detect perspective, lighting, materials

**Use in Pipeline**:
- Stage 2: Image Understanding (analyze reference/style images)
- Stage 6: Validation (check generated image quality)
- Stage 7: Post-Processing (extract pipeline memory)

### 4. Image Generation Models

**Gemini 2.5 Flash Image** (Fast & Cheap):
- **Cost**: $0.039 per image (up to 1024x1024px)
- **Best for**: Simple renders, high-volume tasks
- **Speed**: Fast generation
- **Limitations**: Up to 3 input images, 1K resolution only

**Gemini 3 Pro Image Preview** (Advanced):
- **Cost**: $0.134 per 1K/2K image, $0.24 per 4K image
- **Best for**: Complex renders, professional assets
- **Features**:
  - Up to 14 reference images (6 objects + 5 humans)
  - 1K, 2K, 4K resolutions
  - Grounding with Google Search
  - Thinking process (refines composition before generation)
  - Better text rendering

**Model Selection Strategy**:
- **Simple renders** → Flash Image ($0.039)
- **Complex renders** → Pro Image ($0.134-0.24)
- **CAD/Technical** → Pro Image (better precision)
- **High volume** → Flash Image (cost-effective)

---

## Implementation Details

### Stage 1: Semantic Parsing Service

**File**: `lib/services/semantic-parsing.ts`

```typescript
import { AISDKService } from './ai-sdk-service';

export interface DesignIntent {
  userIntent: string;
  structuralInference: string[];
  materialSpecs: string[];
  aecRequirements: {
    perspective?: 'orthographic' | 'perspective' | 'isometric';
    lighting?: string;
    materials?: string[];
    scale?: string;
  };
  complexity: 'simple' | 'medium' | 'complex';
}

export class SemanticParsingService {
  private static aiService = AISDKService.getInstance();

  /**
   * Parse user prompt to extract design intent and AEC requirements
   * Uses cheap Gemini 2.5 Flash model with STRUCTURED OUTPUTS
   * This guarantees type-safe, parseable JSON responses
   */
  static async parseDesignIntent(
    prompt: string,
    toolContext?: { toolId: string; toolName: string }
  ): Promise<DesignIntent> {
    const systemPrompt = `You are an expert architectural AI assistant. Analyze the user's prompt and extract:
1. User's design intent (what they want to create)
2. Structural inference (architectural elements mentioned)
3. Material specifications (materials, textures, finishes)
4. AEC-specific requirements (perspective, lighting, scale, etc.)
5. Task complexity (simple, medium, complex)

User prompt: "${prompt}"
${toolContext ? `Tool context: ${toolContext.toolName}` : ''}`;

    // Use structured outputs for guaranteed JSON schema compliance
    const response = await this.aiService.generateContent({
      model: 'gemini-2.5-flash', // Cheap model
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            userIntent: {
              type: 'string',
              description: 'The user\'s primary design intent'
            },
            structuralInference: {
              type: 'array',
              items: { type: 'string' },
              description: 'Architectural elements mentioned in the prompt'
            },
            materialSpecs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Materials, textures, and finishes specified'
            },
            aecRequirements: {
              type: 'object',
              properties: {
                perspective: {
                  type: 'string',
                  enum: ['orthographic', 'perspective', 'isometric'],
                  description: 'Required perspective type'
                },
                lighting: {
                  type: 'string',
                  description: 'Lighting requirements'
                },
                materials: {
                  type: 'array',
                  items: { type: 'string' }
                },
                scale: {
                  type: 'string',
                  description: 'Scale requirements'
                }
              }
            },
            complexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex'],
              description: 'Task complexity level'
            }
          },
          required: ['userIntent', 'structuralInference', 'materialSpecs', 'aecRequirements', 'complexity']
        },
        temperature: 0.3 // Low temperature for consistent parsing
      }
    });

    // Parse guaranteed JSON response
    const designIntent = JSON.parse(response.text) as DesignIntent;
    return designIntent;
  }
}
```

**Cost**: ~$0.001 per request (Gemini 2.5 Flash)

---

### Stage 2: Image Understanding Service

**File**: `lib/services/image-understanding.ts`

```typescript
import { AISDKService } from './ai-sdk-service';

export interface ImageAnalysis {
  styleCodes: {
    colorPalette: string[];
    lightingStyle: string;
    materialStyle: string;
    architecturalStyle: string;
  };
  geometry: {
    perspective: 'orthographic' | 'perspective' | 'isometric';
    focalLength: string;
    cameraAngle: string;
  };
  architecturalElements: string[];
  materials: string[];
  lighting: {
    type: string;
    direction: string;
    mood: string;
  };
}

export class ImageUnderstandingService {
  private static aiService = AISDKService.getInstance();

  /**
   * Analyze reference image to extract style, geometry, materials
   * Uses cheap Gemini 2.5 Flash Vision model
   */
  static async analyzeReferenceImage(
    imageData: string, // Base64
    imageType: string
  ): Promise<ImageAnalysis> {
    const systemPrompt = `You are an expert architectural image analyst. Analyze this architectural image and extract:

1. Style codes:
   - Color palette (dominant colors)
   - Lighting style (natural, artificial, mixed)
   - Material style (concrete, glass, wood, etc.)
   - Architectural style (modern, traditional, etc.)

2. Geometry:
   - Perspective type (orthographic, perspective, isometric)
   - Focal length (wide, normal, telephoto)
   - Camera angle (eye-level, bird's eye, worm's eye)

3. Architectural elements:
   - List of visible architectural elements (walls, windows, doors, etc.)

4. Materials:
   - List of materials visible in the image

5. Lighting:
   - Type (natural, artificial, mixed)
   - Direction (from left, from right, front, back)
   - Mood (bright, moody, dramatic, etc.)

Return JSON with this structure:
{
  "styleCodes": {
    "colorPalette": ["color1", "color2"],
    "lightingStyle": "string",
    "materialStyle": "string",
    "architecturalStyle": "string"
  },
  "geometry": {
    "perspective": "orthographic|perspective|isometric",
    "focalLength": "wide|normal|telephoto",
    "cameraAngle": "eye-level|bird's-eye|worm's-eye"
  },
  "architecturalElements": ["element1", "element2"],
  "materials": ["material1", "material2"],
  "lighting": {
    "type": "natural|artificial|mixed",
    "direction": "string",
    "mood": "string"
  }
}`;

    // Use Gemini 2.5 Flash with vision capabilities
    const response = await this.aiService.generateText(
      systemPrompt,
      {
        temperature: 0.3,
        maxTokens: 1000
      },
      [
        {
          inlineData: {
            mimeType: imageType,
            data: imageData
          }
        }
      ]
    );

    const analysis = JSON.parse(response.text) as ImageAnalysis;
    return analysis;
  }

  /**
   * Analyze style reference image
   */
  static async analyzeStyleReference(
    imageData: string,
    imageType: string
  ): Promise<{ styleCharacteristics: string[]; visualElements: string[] }> {
    const systemPrompt = `Analyze this style reference image and extract:
1. Style characteristics (what makes this style unique)
2. Visual elements (patterns, textures, compositions)

Return JSON:
{
  "styleCharacteristics": ["char1", "char2"],
  "visualElements": ["element1", "element2"]
}`;

    const response = await this.aiService.generateText(
      systemPrompt,
      { temperature: 0.3, maxTokens: 500 },
      [{ inlineData: { mimeType: imageType, data: imageData } }]
    );

    return JSON.parse(response.text);
  }
}
```

**Cost**: ~$0.001 per image (Gemini 2.5 Flash Vision)

---

### Stage 3: Prompt Optimization Service

**File**: `lib/services/prompt-optimizer.ts`

```typescript
import { DesignIntent } from './semantic-parsing';
import { ImageAnalysis } from './image-understanding';
import { AISDKService } from './ai-sdk-service';

export class PromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Create optimized final prompt using all inputs
   * Uses cheap Gemini 2.5 Flash model
   */
  static async optimizePrompt(
    userPrompt: string,
    designIntent: DesignIntent,
    referenceAnalysis?: ImageAnalysis,
    styleAnalysis?: { styleCharacteristics: string[]; visualElements: string[] },
    toolContext?: { toolId: string; toolName: string },
    pipelineMemory?: {
      styleCodes?: any;
      palette?: string[];
      geometry?: any;
      materials?: string[];
    }
  ): Promise<string> {
    // Build context for prompt optimization
    const contextParts: string[] = [];

    // Add design intent
    contextParts.push(`Design Intent: ${designIntent.userIntent}`);
    if (designIntent.structuralInference.length > 0) {
      contextParts.push(`Structural Elements: ${designIntent.structuralInference.join(', ')}`);
    }
    if (designIntent.materialSpecs.length > 0) {
      contextParts.push(`Materials: ${designIntent.materialSpecs.join(', ')}`);
    }

    // Add reference image analysis
    if (referenceAnalysis) {
      contextParts.push(`Reference Image Style: ${referenceAnalysis.styleCodes.architecturalStyle}`);
      contextParts.push(`Reference Palette: ${referenceAnalysis.styleCodes.colorPalette.join(', ')}`);
      contextParts.push(`Reference Geometry: ${referenceAnalysis.geometry.perspective}, ${referenceAnalysis.geometry.cameraAngle}`);
      contextParts.push(`Reference Materials: ${referenceAnalysis.materials.join(', ')}`);
      contextParts.push(`Reference Lighting: ${referenceAnalysis.lighting.type}, ${referenceAnalysis.lighting.mood}`);
    }

    // Add style reference analysis
    if (styleAnalysis) {
      contextParts.push(`Style Characteristics: ${styleAnalysis.styleCharacteristics.join(', ')}`);
      contextParts.push(`Visual Elements: ${styleAnalysis.visualElements.join(', ')}`);
    }

    // Add pipeline memory (for consistency)
    if (pipelineMemory) {
      if (pipelineMemory.palette) {
        contextParts.push(`Consistent Palette: ${pipelineMemory.palette.join(', ')}`);
      }
      if (pipelineMemory.geometry) {
        contextParts.push(`Consistent Geometry: ${JSON.stringify(pipelineMemory.geometry)}`);
      }
      if (pipelineMemory.materials) {
        contextParts.push(`Consistent Materials: ${pipelineMemory.materials.join(', ')}`);
      }
    }

    // Add tool context
    if (toolContext) {
      contextParts.push(`Tool: ${toolContext.toolName}`);
    }

    // Add AEC constraints
    if (designIntent.aecRequirements) {
      const req = designIntent.aecRequirements;
      if (req.perspective) contextParts.push(`Required Perspective: ${req.perspective}`);
      if (req.lighting) contextParts.push(`Required Lighting: ${req.lighting}`);
      if (req.scale) contextParts.push(`Required Scale: ${req.scale}`);
    }

    const systemPrompt = `You are an expert architectural prompt engineer. Create an optimized, detailed prompt for architectural image generation.

User's Original Prompt: "${userPrompt}"

Context:
${contextParts.join('\n')}

Create an optimized prompt that:
1. Preserves the user's original intent
2. Incorporates style/material/geometry from reference images
3. Applies AEC-specific constraints
4. Ensures architectural accuracy
5. Maintains consistency with previous renders (if applicable)

Return ONLY the optimized prompt text, no explanations.`;

    const response = await this.aiService.generateText(systemPrompt, {
      temperature: 0.7, // Higher temperature for creative prompt generation
      maxTokens: 1000
    });

    return response.text.trim();
  }
}
```

**Cost**: ~$0.001 per request (Gemini 2.5 Flash)

---

### Stage 4: Model Router

**File**: `lib/services/model-router.ts`

```typescript
import { DesignIntent } from './semantic-parsing';
import { getModelConfig, getDefaultModel, ModelId } from '@/lib/config/models';

export class ModelRouter {
  /**
   * Select optimal model based on task complexity and requirements
   * Uses simple logic (no AI needed for this)
   */
  static selectModel(
    designIntent: DesignIntent,
    quality: 'standard' | 'high' | 'ultra',
    toolContext?: { toolId: string; toolName: string }
  ): ModelId {
    // Simple rules-based routing (fast and free)
    
    // Complex tasks or ultra quality → Gemini 3 Pro Image
    if (designIntent.complexity === 'complex' || quality === 'ultra') {
      return 'gemini-3-pro-image-preview';
    }

    // CAD tools or technical drawings → Gemini 3 Pro (better precision)
    if (toolContext?.toolId.includes('cad') || toolContext?.toolId.includes('section') || toolContext?.toolId.includes('elevation')) {
      return 'gemini-3-pro-image-preview';
    }

    // Simple/medium tasks → Gemini 2.5 Flash Image (cheaper)
    return 'gemini-2.5-flash-image';
  }

  /**
   * Advanced routing using AI (optional, for complex cases)
   */
  static async selectModelWithAI(
    designIntent: DesignIntent,
    quality: 'standard' | 'high' | 'ultra',
    toolContext?: { toolId: string; toolName: string }
  ): Promise<ModelId> {
    // Use cheap Gemini 2.5 Flash to decide
    const prompt = `Based on this architectural task, recommend the best model:

Task Complexity: ${designIntent.complexity}
Quality Requirement: ${quality}
Tool: ${toolContext?.toolName || 'general render'}
AEC Requirements: ${JSON.stringify(designIntent.aecRequirements)}

Available models:
- gemini-2.5-flash-image: Fast, cheap, good for simple tasks
- gemini-3-pro-image-preview: Slower, expensive, best for complex tasks

Return JSON: {"model": "model-id", "reason": "why"}`;

    // Call AI service (cheap model)
    // ... implementation

    // For now, use simple routing
    return this.selectModel(designIntent, quality, toolContext);
  }
}
```

**Cost**: ~$0.0001 per request (or free if rules-based)

---

### Stage 5: Image Generation (Existing, Enhanced)

**File**: `lib/services/ai-sdk-service.ts` (enhance existing)

```typescript
// Enhanced generateImage to use optimized prompt
async generateImage(request: {
  prompt: string; // Already optimized from Stage 3
  // ... existing params
  optimizedPrompt?: boolean; // Flag to skip further optimization
}): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
  // If prompt is already optimized, skip internal optimization
  if (request.optimizedPrompt) {
    // Use prompt as-is (already optimized by PromptOptimizer)
    // ... existing generation logic
  } else {
    // Fallback to existing logic (backward compatibility)
    // ... existing generation logic
  }
}
```

**Cost**: ~$0.05-0.20 per image (depending on model)

---

### Stage 6: Validation Service

**File**: `lib/services/image-validator.ts`

```typescript
import { AISDKService } from './ai-sdk-service';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  corrections?: string[];
}

export class ImageValidator {
  private static aiService = AISDKService.getInstance();

  /**
   * Validate generated image using cheap vision model
   */
  static async validateImage(
    imageData: string,
    imageType: string,
    designIntent: DesignIntent,
    referenceAnalysis?: ImageAnalysis
  ): Promise<ValidationResult> {
    const systemPrompt = `You are an expert architectural image validator. Analyze this generated architectural image and validate:

1. Perspective grid (is it consistent?)
2. Proportions (are they realistic?)
3. Architectural elements (are they correct?)
4. Materials (are they realistic?)
5. Lighting (is it consistent?)

Compare with reference image if provided.

Return JSON:
{
  "valid": true/false,
  "errors": ["error1", "error2"],
  "warnings": ["warning1"],
  "corrections": ["correction1"] // If errors found, suggest corrections
}`;

    const contents: any[] = [systemPrompt];
    if (referenceAnalysis) {
      contents.push(`Reference requirements: ${JSON.stringify(referenceAnalysis)}`);
    }

    contents.push({
      inlineData: {
        mimeType: imageType,
        data: imageData
      }
    });

    const response = await this.aiService.generateText(
      systemPrompt,
      { temperature: 0.2, maxTokens: 500 },
      contents
    );

    const result = JSON.parse(response.text) as ValidationResult;
    return result;
  }
}
```

**Cost**: ~$0.001 per image (Gemini 2.5 Flash Vision)

---

### Stage 7: Post-Processing Analysis

**File**: `lib/services/pipeline-memory.ts` (enhance existing)

```typescript
import { AISDKService } from './ai-sdk-service';
import { ImageUnderstandingService } from './image-understanding';

export class PipelineMemoryService {
  /**
   * Extract pipeline memory from generated image
   * Uses cheap vision model
   */
  static async extractMemory(
    imageData: string,
    imageType: string
  ): Promise<{
    styleCodes: any;
    palette: string[];
    geometry: any;
    materials: string[];
  }> {
    // Reuse ImageUnderstandingService to analyze generated image
    const analysis = await ImageUnderstandingService.analyzeReferenceImage(
      imageData,
      imageType
    );

    return {
      styleCodes: analysis.styleCodes,
      palette: analysis.styleCodes.colorPalette,
      geometry: analysis.geometry,
      materials: analysis.materials
    };
  }

  /**
   * Save memory to database for future consistency
   */
  static async saveMemory(
    chainId: string,
    memory: any
  ): Promise<void> {
    // Save to render_pipeline_memory table
    // ... implementation
  }

  /**
   * Get memory from chain for consistency
   */
  static async getMemory(chainId: string): Promise<any> {
    // Load from database
    // ... implementation
  }
}
```

**Cost**: ~$0.001 per image (Gemini 2.5 Flash Vision)

---

## Simplified Flow Diagram

### Current Flow (What We Have Now)
```
User Prompt + Reference Image + Style Reference
    ↓
[Manual prompt concatenation]
    ↓
generateContent() → Gemini 3 Pro Image ($0.10-0.20)
    ↓
Image Output
```

### Target Flow (What We'll Build)
```
User Prompt + Reference Image + Style Reference
    ↓
[Stage 1] Gemini 2.5 Flash → Parse Design Intent ($0.001)
    ↓
[Stage 2] Gemini 2.5 Flash Vision → Analyze Images ($0.001 each)
    ↓
[Stage 3] Gemini 2.5 Flash → Optimize Prompt ($0.001)
    ↓
[Stage 4] Model Router → Select Model (free)
    ↓
[Stage 5] Gemini 3 Pro Image / Flash Image → Generate ($0.05-0.20)
    ↓
[Stage 6] Gemini 2.5 Flash Vision → Validate ($0.001)
    ↓
[Stage 7] Gemini 2.5 Flash Vision → Extract Memory ($0.001)
    ↓
Final Image + Memory
```

**Total Cost**: ~$0.06-0.21 (vs. $0.10-0.20 current)
**Quality**: Significantly better (optimized prompts + validation)

---

## Complete Integration Flow

**File**: `lib/services/render-pipeline.ts` (NEW - Orchestrator)

```typescript
import { SemanticParsingService } from './semantic-parsing';
import { ImageUnderstandingService } from './image-understanding';
import { PromptOptimizer } from './prompt-optimizer';
import { ModelRouter } from './model-router';
import { AISDKService } from './ai-sdk-service';
import { ImageValidator } from './image-validator';
import { PipelineMemoryService } from './pipeline-memory';

export class RenderPipeline {
  private static aiService = AISDKService.getInstance();

  /**
   * Complete render pipeline with all stages
   */
  static async generateRender(request: {
    prompt: string;
    referenceImageData?: string;
    referenceImageType?: string;
    styleReferenceData?: string;
    styleReferenceType?: string;
    toolContext?: { toolId: string; toolName: string };
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    chainId?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // STAGE 1: Semantic Parsing
      const designIntent = await SemanticParsingService.parseDesignIntent(
        request.prompt,
        request.toolContext
      );

      // STAGE 2: Image Understanding (parallel if both images exist)
      const [referenceAnalysis, styleAnalysis] = await Promise.all([
        request.referenceImageData
          ? ImageUnderstandingService.analyzeReferenceImage(
              request.referenceImageData,
              request.referenceImageType || 'image/png'
            )
          : Promise.resolve(undefined),
        request.styleReferenceData
          ? ImageUnderstandingService.analyzeStyleReference(
              request.styleReferenceData,
              request.styleReferenceType || 'image/png'
            )
          : Promise.resolve(undefined)
      ]);

      // Get pipeline memory for consistency
      const pipelineMemory = request.chainId
        ? await PipelineMemoryService.getMemory(request.chainId)
        : undefined;

      // STAGE 3: Prompt Optimization
      const optimizedPrompt = await PromptOptimizer.optimizePrompt(
        request.prompt,
        designIntent,
        referenceAnalysis,
        styleAnalysis,
        request.toolContext,
        pipelineMemory
      );

      // STAGE 4: Model Routing
      const selectedModel = ModelRouter.selectModel(
        designIntent,
        request.quality,
        request.toolContext
      );

      // STAGE 5: Image Generation (expensive model)
      const generationResult = await this.aiService.generateImage({
        prompt: optimizedPrompt,
        aspectRatio: request.aspectRatio,
        uploadedImageData: request.referenceImageData,
        uploadedImageType: request.referenceImageType,
        styleTransferImageData: request.styleReferenceData,
        styleTransferImageType: request.styleReferenceType,
        model: selectedModel,
        imageSize: request.quality === 'ultra' ? '4K' : request.quality === 'high' ? '2K' : '1K',
        optimizedPrompt: true // Flag to skip internal optimization
      });

      if (!generationResult.success || !generationResult.data) {
        return generationResult;
      }

      // STAGE 6: Validation
      const validation = await ImageValidator.validateImage(
        generationResult.data.imageData!,
        'image/png',
        designIntent,
        referenceAnalysis
      );

      // If validation fails, regenerate with corrections
      if (!validation.valid && validation.corrections) {
        // Add corrections to prompt and regenerate
        const correctedPrompt = `${optimizedPrompt}. Corrections: ${validation.corrections.join(', ')}`;
        
        const retryResult = await this.aiService.generateImage({
          prompt: correctedPrompt,
          aspectRatio: request.aspectRatio,
          model: selectedModel,
          optimizedPrompt: true
        });

        if (retryResult.success && retryResult.data) {
          // Validate again
          const retryValidation = await ImageValidator.validateImage(
            retryResult.data.imageData!,
            'image/png',
            designIntent
          );

          if (retryValidation.valid) {
            // STAGE 7: Extract memory
            const memory = await PipelineMemoryService.extractMemory(
              retryResult.data.imageData!,
              'image/png'
            );

            // Save memory for future consistency
            if (request.chainId) {
              await PipelineMemoryService.saveMemory(request.chainId, memory);
            }

            return {
              success: true,
              data: {
                ...retryResult.data,
                memory,
                validation: retryValidation
              }
            };
          }
        }
      }

      // STAGE 7: Extract memory
      const memory = await PipelineMemoryService.extractMemory(
        generationResult.data.imageData!,
        'image/png'
      );

      // Save memory for future consistency
      if (request.chainId) {
        await PipelineMemoryService.saveMemory(request.chainId, memory);
      }

      return {
        success: true,
        data: {
          ...generationResult.data,
          memory,
          validation
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline failed'
      };
    }
  }
}
```

---

## Integration with Existing Code

### Update `/api/renders` Route

**File**: `app/api/renders/route.ts`

```typescript
// Replace existing generation logic with pipeline
import { RenderPipeline } from '@/lib/services/render-pipeline';

// In handleRenderRequest():
// OLD:
// result = await aiService.generateImage({ ... });

// NEW:
result = await RenderPipeline.generateRender({
  prompt: finalPrompt,
  referenceImageData: imageDataToUse,
  referenceImageType: imageTypeToUse,
  styleReferenceData: styleTransferImageData,
  styleReferenceType: styleTransferImageType,
  toolContext: metadata?.sourcePlatform === 'tools' ? {
    toolId: metadata.toolId || 'unknown',
    toolName: metadata.toolName || 'Unknown Tool'
  } : undefined,
  quality,
  aspectRatio,
  chainId: finalChainId
});
```

---

## Google Model Recommendations

### For Cheap Tasks (Stages 1-4, 6-7)

**Gemini 2.5 Flash** (Text + Vision)
- **Cost**: ~$0.0001-0.001 per request
- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens
- **Vision**: Supports image input (multimodal)
- **Use for**:
  - Semantic parsing (Stage 1)
  - Image understanding (Stage 2)
  - Prompt optimization (Stage 3)
  - Model routing (Stage 4)
  - Validation (Stage 6)
  - Memory extraction (Stage 7)
- **Why**: Fast, cheap, good enough for analysis tasks
- **API**: `genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: [...] })`

**Gemini 2.5 Flash Thinking** (Optional, for complex reasoning)
- **Cost**: ~$0.001-0.002 per request (includes thinking tokens)
- **Use for**: Complex prompt optimization when needed
- **API**: `genAI.models.generateContent({ model: 'gemini-2.5-flash', config: { thinkingConfig: { thinkingBudget: 1024 } } })`

### For Expensive Tasks (Stage 5 - Final Generation)

**Gemini 3 Pro Image Preview** (Image Generation)
- **Cost**: ~$0.10-0.20 per image (depending on size)
- **Capabilities**:
  - Up to 4K resolution
  - Advanced architectural understanding
  - Better prompt adherence
- **Use for**: 
  - Complex tasks (CAD, technical drawings)
  - Ultra quality renders
  - AEC-specific precision requirements
- **API**: `genAI.models.generateContent({ model: 'gemini-3-pro-image-preview', contents: [...], config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio, imageSize } } })`

**Gemini 2.5 Flash Image** (Image Generation)
- **Cost**: ~$0.05 per image
- **Capabilities**:
  - 1K resolution only
  - Fast generation
  - Good for simple/medium tasks
- **Use for**: 
  - Simple/medium complexity renders
  - Standard quality
  - Fast iterations
- **API**: `genAI.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [...], config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } } })`

### Model Selection Strategy

```typescript
// Simple rules (no AI needed)
if (complexity === 'complex' || quality === 'ultra' || toolId.includes('cad')) {
  return 'gemini-3-pro-image-preview'; // Expensive, high quality
} else {
  return 'gemini-2.5-flash-image'; // Cheap, fast
}
```

**Cost Savings**: Using Flash for 80% of tasks saves ~$0.05 per render = **50% cost reduction** on average.

---

## Cost Optimization Strategy

### 1. **Skip Stages When Not Needed**
- No reference image? Skip Stage 2
- No style reference? Skip style analysis
- Simple prompt? Skip Stage 1 (use prompt as-is)
- No chain? Skip memory loading/saving

### 2. **Cache Results**
- Cache design intent parsing (same prompt = same intent)
- Cache image analysis (same image = same analysis)
- Cache model routing decisions

### 3. **Parallel Processing**
- Run reference + style analysis in parallel
- Run validation + memory extraction in parallel

### 4. **Smart Validation**
- Only validate if quality is 'high' or 'ultra'
- Skip validation for simple tasks
- Use fast validation (quick checks only)

---

## Implementation Phases

### Phase 1: Core Pipeline (Week 1-2)
1. ✅ Semantic Parsing Service
2. ✅ Image Understanding Service
3. ✅ Prompt Optimizer
4. ✅ Model Router
5. ✅ Render Pipeline orchestrator

### Phase 2: Validation & Memory (Week 3)
1. ✅ Image Validator
2. ✅ Pipeline Memory Service
3. ✅ Database schema for memory

### Phase 3: Integration (Week 4)
1. ✅ Update `/api/renders` route
2. ✅ Update tools to use pipeline
3. ✅ Update chat interface
4. ✅ Testing & optimization

---

## Benefits

1. **Cost Effective**: Use expensive models only for final generation
2. **Quality Improvement**: Optimized prompts = better outputs
3. **Consistency**: Pipeline memory ensures style/material continuity
4. **Validation**: Catch errors before delivery
5. **LLM-Focused**: No complex CV pipelines, just AI models
6. **Scalable**: Easy to add new stages or improve existing ones

---

## Next Steps

1. ✅ Review this plan
2. ✅ Start Phase 1 implementation
3. ✅ Test with simple cases first
4. ✅ Gradually add complexity
5. ✅ Monitor costs and optimize

---

**Key Insight**: We're using AI to do AI's job - vision models understand images, language models optimize prompts, and we only use expensive models for the final generation. This is the simplest, most cost-effective way to build the technical moat.

---

## Quick Start Implementation

### Step 1: Add Vision Model Support to AISDKService

**File**: `lib/services/ai-sdk-service.ts`

Add method to support vision input:

```typescript
/**
 * Generate text with image input (for vision models)
 */
async generateTextWithImage(
  prompt: string,
  imageData: string,
  imageType: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{ text: string; usage?: any }> {
  const response = await this.genAI.models.generateContent({
    model: 'gemini-2.5-flash', // Cheap vision model
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: imageType,
          data: imageData
        }
      }
    ],
    config: {
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxTokens ?? 1000,
    },
  });

  return {
    text: response.text,
    usage: response.usageMetadata,
  };
}
```

### Step 2: Create Simple Prompt Optimizer (MVP)

**File**: `lib/services/simple-prompt-optimizer.ts` (Start Simple)

```typescript
import { AISDKService } from './ai-sdk-service';

export class SimplePromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Simple version: Use vision model to create optimized prompt
   * This is the EASIEST solution as you mentioned
   * Uses STRUCTURED OUTPUTS for guaranteed JSON response
   */
  static async optimizePrompt(
    userPrompt: string,
    referenceImageData?: string,
    referenceImageType?: string,
    styleReferenceData?: string,
    styleReferenceType?: string
  ): Promise<string> {
    // Build prompt for vision model
    let visionPrompt = `You are an expert architectural prompt engineer. Analyze the user's prompt and any reference images, then create an optimized prompt for architectural image generation.

User's Prompt: "${userPrompt}"

${referenceImageData ? 'A reference image is provided. Analyze it and extract: style, palette, geometry, materials, lighting.' : ''}
${styleReferenceData ? 'A style reference image is provided. Analyze it and extract: style characteristics, visual elements.' : ''}

Create an optimized prompt that:
1. Preserves the user's original intent
2. Incorporates style/material/geometry from reference images (if provided)
3. Ensures architectural accuracy
4. Is detailed and specific`;

    // If we have images, use vision model with structured outputs
    if (referenceImageData || styleReferenceData) {
      const contents: any[] = [visionPrompt];
      
      if (referenceImageData) {
        contents.push({
          inlineData: {
            mimeType: referenceImageType || 'image/png',
            data: referenceImageData
          }
        });
      }
      
      if (styleReferenceData) {
        contents.push({
          inlineData: {
            mimeType: styleReferenceType || 'image/png',
            data: styleReferenceData
          }
        });
      }

      // Use structured outputs for guaranteed JSON response
      const response = await this.aiService.genAI.models.generateContent({
        model: 'gemini-2.5-flash', // Cheap vision model
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The optimized architectural image generation prompt'
              },
              extractedElements: {
                type: 'object',
                properties: {
                  style: { type: 'string' },
                  palette: { type: 'array', items: { type: 'string' } },
                  geometry: { type: 'string' },
                  materials: { type: 'array', items: { type: 'string' } },
                  lighting: { type: 'string' }
                }
              }
            },
            required: ['optimizedPrompt']
          },
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const result = JSON.parse(response.text);
      return result.optimizedPrompt;
    } else {
      // No images, just optimize text prompt with structured outputs
      const response = await this.aiService.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: visionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              optimizedPrompt: {
                type: 'string',
                description: 'The optimized architectural image generation prompt'
              }
            },
            required: ['optimizedPrompt']
          },
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const result = JSON.parse(response.text);
      return result.optimizedPrompt;
    }
  }
}
```

### Step 3: Update Render API to Use Optimizer

**File**: `app/api/renders/route.ts`

```typescript
// Add at top
import { SimplePromptOptimizer } from '@/lib/services/simple-prompt-optimizer';

// In handleRenderRequest(), before calling generateImage():
// OLD:
// let contextualPrompt = finalPrompt;

// NEW:
let contextualPrompt = finalPrompt;

// If we have reference images or style reference, optimize prompt
if (referenceRenderImageData || styleTransferImageData) {
  logger.log('🔍 Optimizing prompt with vision model...');
  contextualPrompt = await SimplePromptOptimizer.optimizePrompt(
    finalPrompt,
    referenceRenderImageData,
    referenceRenderImageType,
    styleTransferImageData,
    styleTransferImageType
  );
  logger.log('✅ Optimized prompt:', contextualPrompt.substring(0, 100) + '...');
}

// Then use optimized prompt for generation
result = await aiService.generateImage({
  prompt: contextualPrompt, // Use optimized prompt
  // ... rest of params
});
```

**That's it!** This is the simplest solution - just add prompt optimization using a cheap vision model before generation.

### Optional: Add Multi-Turn Chat Support

For iterative refinement, you can add chat session support:

```typescript
// In AISDKService, add chat methods:
async createChatSession(model: string): Promise<{ id: string }> {
  const chat = await this.genAI.chats.create({
    model,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '2K'
      }
    }
  });
  return { id: chat.id };
}

async sendChatMessage(
  chatSessionId: string,
  message: string,
  imageData?: string,
  imageType?: string,
  config?: {
    aspectRatio?: string;
    imageSize?: '1K' | '2K' | '4K';
  }
): Promise<ImageGenerationResult> {
  const chat = this.genAI.chats.get(chatSessionId);
  const contents: any[] = [message];
  
  if (imageData) {
    contents.push({
      inlineData: {
        data: imageData,
        mimeType: imageType || 'image/png'
      }
    });
  }
  
  const response = await chat.sendMessage({
    contents,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: config?.aspectRatio || '16:9',
        imageSize: config?.imageSize || '2K'
      }
    }
  });
  
  // Extract image from response
  const imagePart = response.candidates[0].content.parts.find(
    (part: any) => part.inlineData
  );
  
  if (!imagePart?.inlineData) {
    throw new Error('No image in response');
  }
  
  return {
    imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    imageData: imagePart.inlineData.data,
    // ... other fields
  };
}
```

**Note**: Thought signatures are handled automatically by the SDK - no manual management needed!

---

## Video Generation: Same Multi-Stage Pipeline

Video generation follows the **exact same LLM-focused approach** as images, but uses **Veo 3.1** for final generation.

### Video Generation Models & Pricing

#### Veo 3.1 Standard
- **Cost**: $0.40 per second of video
- **Best for**: High-quality, professional videos
- **Features**: 
  - Up to 8 seconds (4s, 6s, 8s options)
  - 720p or 1080p resolution
  - Native audio generation
  - Video extension (up to 20x, 7s per extension)
  - Up to 3 reference images
  - First/last frame interpolation

#### Veo 3.1 Fast
- **Cost**: $0.15 per second of video
- **Best for**: Rapid iteration, A/B testing, high-volume
- **Features**: Same as Standard, optimized for speed

**Cost Examples**:
- 8-second video (Standard): $3.20
- 8-second video (Fast): $1.20
- 4-second video (Standard): $1.60
- 4-second video (Fast): $0.60

### Video Generation Pipeline (Same 7 Stages)

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                               │
│  • User Prompt (with video-specific cues)                    │
│  • Reference Image(s) (up to 3 for Veo 3.1)                   │
│  • Previous Video (for extension)                            │
│  • First/Last Frame Images (for interpolation)               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         STAGE 1: SEMANTIC PARSING (Cheap Model)             │
│         Model: Gemini 2.5 Flash                             │
│         Cost: ~$0.001 per request                            │
│                                                              │
│  • Extract video intent (subject, action, style)            │
│  • Detect camera motion requirements                        │
│  • Identify audio cues (dialogue, SFX, ambience)           │
│  • Determine video complexity                               │
│                                                              │
│  Output: VideoDesignIntent object                           │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 2: IMAGE UNDERSTANDING (Cheap Vision Model)        │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per image                                   │
│                                                              │
│  If Reference Images exist:                                  │
│    • Analyze each reference image                           │
│    • Extract style, subject, composition                     │
│    • Identify elements to preserve                          │
│                                                              │
│  If First/Last Frame Images exist:                         │
│    • Analyze starting composition                           │
│    • Analyze ending composition                             │
│    • Determine interpolation requirements                   │
│                                                              │
│  Output: VideoImageAnalysis object                          │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 3: PROMPT OPTIMIZATION (Cheap Model)              │
│    Model: Gemini 2.5 Flash                                   │
│    Cost: ~$0.001 per request                                │
│                                                              │
│  Input:                                                      │
│    • VideoDesignIntent (from Stage 1)                       │
│    • VideoImageAnalysis (from Stage 2)                       │
│    • Video-specific requirements                            │
│                                                              │
│  Process:                                                    │
│    • Create optimized video prompt                           │
│    • Add camera motion descriptions                         │
│    • Include audio cues (dialogue, SFX, ambience)           │
│    • Apply AEC-specific constraints                        │
│    • Optimize for Veo's strengths                           │
│                                                              │
│  Output: Optimized Video Prompt                              │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 4: MODEL ROUTING (Cheap Model)                    │
│    Model: Gemini 2.5 Flash-Lite                             │
│    Cost: ~$0.0001 per request                               │
│                                                              │
│  • Analyze task complexity                                 │
│  • Select: Veo 3.1 Standard vs Fast                        │
│  • Determine duration (4s, 6s, 8s)                         │
│  • Select resolution (720p vs 1080p)                        │
│                                                              │
│  Output: VideoGenerationConfig                             │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 5: VIDEO GENERATION (Expensive Model)             │
│    Model: Veo 3.1 Standard or Fast                          │
│    Cost: $0.15-0.40 per second                              │
│                                                              │
│  Input:                                                      │
│    • Optimized Video Prompt (from Stage 3)                  │
│    • Reference Images (if exists)                           │
│    • First/Last Frame Images (if interpolation)             │
│    • Previous Video (if extension)                          │
│    • VideoGenerationConfig (from Stage 4)                   │
│                                                              │
│  Process:                                                    │
│    • Generate video asynchronously                          │
│    • Poll operation status                                  │
│    • Download generated video                                │
│                                                              │
│  Output: Generated Video                                     │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 6: VALIDATION (Cheap Vision Model)                │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per video                                  │
│                                                              │
│  • Extract key frames from video                            │
│  • Validate composition, motion, quality                   │
│  • Check audio synchronization                             │
│  • Detect obvious errors                                    │
│                                                              │
│  If validation fails → Regenerate with corrections         │
│  If validation passes → Continue                            │
│                                                              │
│  Output: VideoValidationResult                              │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    STAGE 7: POST-PROCESSING ANALYSIS (Cheap Vision)        │
│    Model: Gemini 2.5 Flash (Vision)                         │
│    Cost: ~$0.001 per video                                  │
│                                                              │
│  • Extract style codes from video                           │
│  • Extract camera motion patterns                          │
│  • Extract audio characteristics                            │
│  • Store for video extension consistency                    │
│                                                              │
│  Output: VideoPipelineMemory                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL OUTPUT                              │
│  • Generated Video                                           │
│  • Video Pipeline Memory (for extensions)                   │
│  • Validation Results                                        │
└─────────────────────────────────────────────────────────────┘
```

### Video Cost Analysis

**Current Approach (No Optimization)**:
- **Cost per 8s video**: $3.20 (Veo 3.1 Standard) or $1.20 (Fast)
- **No prompt optimization**: Lower quality, more regenerations
- **No validation**: Errors require full regeneration (2x cost)

**Target Approach (LLM-Focused Multi-Stage)**:
- **Stage 1 (Semantic Parsing)**: $0.001 (Gemini 2.5 Flash)
- **Stage 2 (Image Understanding)**: $0.001-0.003 (1-3 reference images)
- **Stage 3 (Prompt Optimization)**: $0.001 (Gemini 2.5 Flash)
- **Stage 4 (Model Routing)**: $0.0001 (Gemini 2.5 Flash-Lite)
- **Stage 5 (Video Generation)**: 
  - Fast: $1.20 (8s) or $0.60 (4s)
  - Standard: $3.20 (8s) or $1.60 (4s)
- **Stage 6 (Validation)**: $0.001 (Gemini 2.5 Flash Vision)
- **Stage 7 (Post-Processing)**: $0.001 (Gemini 2.5 Flash Vision)

**Total Cost**:
- **8s Fast video**: ~$1.20-1.21 (vs. $1.20 current)
- **8s Standard video**: ~$3.20-3.21 (vs. $3.20 current)
- **4s Fast video**: ~$0.60-0.61 (vs. $0.60 current)

**ROI**: Minimal cost increase (~$0.01) but **massive quality improvement** and **fewer failed generations**.

### Video Implementation: Quick Start

#### Step 1: Add Video Generation Support to AISDKService

**File**: `lib/services/ai-sdk-service.ts`

```typescript
/**
 * Generate video using Veo 3.1
 * Returns operation object for polling
 */
async generateVideo(
  prompt: string,
  config?: {
    model?: 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview';
    referenceImages?: Array<{ imageData: string; imageType: string; referenceType?: 'asset' | 'person' }>;
    firstFrameImage?: { imageData: string; imageType: string };
    lastFrameImage?: { imageData: string; imageType: string };
    previousVideo?: { videoData: string; videoType: string }; // For extension
    aspectRatio?: '16:9' | '9:16';
    resolution?: '720p' | '1080p';
    durationSeconds?: 4 | 6 | 8;
    negativePrompt?: string;
  }
): Promise<{ operation: any; operationName: string }> {
  const model = config?.model || 'veo-3.1-fast-generate-preview';
  
  // Build video generation request
  const videoConfig: any = {
    aspectRatio: config?.aspectRatio || '16:9',
    resolution: config?.resolution || '720p',
    durationSeconds: config?.durationSeconds || 8,
  };
  
  if (config?.negativePrompt) {
    videoConfig.negativePrompt = config.negativePrompt;
  }
  
  if (config?.referenceImages && config.referenceImages.length > 0) {
    videoConfig.referenceImages = config.referenceImages.map(img => ({
      image: {
        inlineData: {
          mimeType: img.imageType,
          data: img.imageData
        }
      },
      referenceType: img.referenceType || 'asset'
    }));
  }
  
  if (config?.firstFrameImage) {
    videoConfig.image = {
      inlineData: {
        mimeType: config.firstFrameImage.imageType,
        data: config.firstFrameImage.imageData
      }
    };
  }
  
  if (config?.lastFrameImage) {
    videoConfig.lastFrame = {
      inlineData: {
        mimeType: config.lastFrameImage.imageType,
        data: config.lastFrameImage.imageData
      }
    };
  }
  
  if (config?.previousVideo) {
    videoConfig.video = {
      inlineData: {
        mimeType: config.previousVideo.videoType,
        data: config.previousVideo.videoData
      }
    };
  }
  
  const operation = await this.genAI.models.generateVideos({
    model,
    prompt,
    config: videoConfig
  });
  
  return {
    operation,
    operationName: operation.name
  };
}

/**
 * Poll video generation operation until complete
 */
async pollVideoOperation(operationName: string): Promise<{ video: any; done: boolean }> {
  let operation = await this.genAI.operations.getVideosOperation({
    operation: { name: operationName }
  });
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    operation = await this.genAI.operations.getVideosOperation({
      operation: { name: operationName }
    });
  }
  
  if (operation.response?.generatedVideos?.[0]) {
    return {
      video: operation.response.generatedVideos[0],
      done: true
    };
  }
  
  throw new Error('Video generation failed');
}

/**
 * Download generated video
 */
async downloadVideo(videoFile: any, downloadPath: string): Promise<void> {
  await this.genAI.files.download({
    file: videoFile,
    downloadPath
  });
}
```

#### Step 2: Create Video Prompt Optimizer

**File**: `lib/services/video-prompt-optimizer.ts`

```typescript
import { AISDKService } from './ai-sdk-service';

export interface VideoDesignIntent {
  subject: string;
  action: string;
  style: string;
  cameraMotion?: string;
  composition?: string;
  audioCues?: {
    dialogue?: string[];
    soundEffects?: string[];
    ambientNoise?: string[];
  };
  complexity: 'simple' | 'medium' | 'complex';
}

export class VideoPromptOptimizer {
  private static aiService = AISDKService.getInstance();

  /**
   * Optimize video prompt using structured outputs
   * Uses cheap Gemini 2.5 Flash model
   */
  static async optimizeVideoPrompt(
    userPrompt: string,
    referenceImages?: Array<{ imageData: string; imageType: string }>,
    previousVideoAnalysis?: any
  ): Promise<{ optimizedPrompt: string; designIntent: VideoDesignIntent }> {
    let visionPrompt = `You are an expert video prompt engineer specializing in architectural and cinematic video generation. Analyze the user's prompt and any reference images, then create an optimized prompt for Veo 3.1 video generation.

User's Prompt: "${userPrompt}"

${referenceImages ? `Reference images are provided. Analyze them and extract: subject, style, composition, visual elements to preserve.` : ''}
${previousVideoAnalysis ? `Previous video analysis: ${JSON.stringify(previousVideoAnalysis)}` : ''}

Create an optimized video prompt that:
1. Preserves the user's original intent
2. Includes specific camera motion descriptions (dolly shot, tracking, pan, zoom, etc.)
3. Specifies composition (wide shot, close-up, medium shot, etc.)
4. Includes audio cues if mentioned (dialogue in quotes, sound effects, ambient noise)
5. Incorporates style/material/geometry from reference images (if provided)
6. Ensures architectural/cinematic accuracy
7. Is detailed and specific for Veo 3.1

Return JSON with optimized prompt and extracted design intent.`;

    const contents: any[] = [visionPrompt];
    
    if (referenceImages) {
      for (const img of referenceImages) {
        contents.push({
          inlineData: {
            mimeType: img.imageType,
            data: img.imageData
          }
        });
      }
    }

    // Use structured outputs for guaranteed JSON response
    const response = await this.aiService.genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            optimizedPrompt: {
              type: 'string',
              description: 'The optimized video generation prompt for Veo 3.1'
            },
            designIntent: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                action: { type: 'string' },
                style: { type: 'string' },
                cameraMotion: { type: 'string' },
                composition: { type: 'string' },
                audioCues: {
                  type: 'object',
                  properties: {
                    dialogue: { type: 'array', items: { type: 'string' } },
                    soundEffects: { type: 'array', items: { type: 'string' } },
                    ambientNoise: { type: 'array', items: { type: 'string' } }
                  }
                },
                complexity: {
                  type: 'string',
                  enum: ['simple', 'medium', 'complex']
                }
              },
              required: ['subject', 'action', 'style', 'complexity']
            }
          },
          required: ['optimizedPrompt', 'designIntent']
        },
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });

    const result = JSON.parse(response.text);
    return {
      optimizedPrompt: result.optimizedPrompt,
      designIntent: result.designIntent
    };
  }
}
```

#### Step 3: Update Video Render API

**File**: `app/api/videos/route.ts` (or add to existing render route)

```typescript
import { VideoPromptOptimizer } from '@/lib/services/video-prompt-optimizer';
import { AISDKService } from '@/lib/services/ai-sdk-service';

export async function POST(request: Request) {
  const { prompt, referenceImages, aspectRatio, duration, quality } = await request.json();
  
  const aiService = AISDKService.getInstance();
  
  // Stage 1-3: Optimize prompt (if we have reference images)
  let optimizedPrompt = prompt;
  let designIntent;
  
  if (referenceImages && referenceImages.length > 0) {
    const optimization = await VideoPromptOptimizer.optimizeVideoPrompt(
      prompt,
      referenceImages
    );
    optimizedPrompt = optimization.optimizedPrompt;
    designIntent = optimization.designIntent;
  }
  
  // Stage 4: Model routing (simple rules-based)
  const model = designIntent?.complexity === 'complex' 
    ? 'veo-3.1-generate-preview' 
    : 'veo-3.1-fast-generate-preview';
  
  const resolution = quality === 'ultra' ? '1080p' : '720p';
  const durationSeconds = duration || 8;
  
  // Stage 5: Generate video
  const { operation, operationName } = await aiService.generateVideo(
    optimizedPrompt,
    {
      model,
      referenceImages: referenceImages?.map((img: any) => ({
        imageData: img.data,
        imageType: img.type,
        referenceType: 'asset'
      })),
      aspectRatio: aspectRatio || '16:9',
      resolution,
      durationSeconds
    }
  );
  
  // Return operation name for client to poll
  return Response.json({
    operationName,
    status: 'processing'
  });
}

// Separate endpoint for polling
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operationName = searchParams.get('operationName');
  
  if (!operationName) {
    return Response.json({ error: 'operationName required' }, { status: 400 });
  }
  
  const aiService = AISDKService.getInstance();
  const result = await aiService.pollVideoOperation(operationName);
  
  if (result.done) {
    // Download video and return URL
    const videoUrl = await aiService.downloadVideo(result.video.video, '/tmp/video.mp4');
    return Response.json({
      status: 'completed',
      videoUrl
    });
  }
  
  return Response.json({
    status: 'processing'
  });
}
```

### Video-Specific Features

#### 1. Video Extension
Extend previously generated videos by 7 seconds (up to 20 times):

```typescript
// Extend a video
const { operation } = await aiService.generateVideo(
  'Continue the architectural walkthrough, showing the kitchen area',
  {
    previousVideo: {
      videoData: previousVideoBase64,
      videoType: 'video/mp4'
    },
    durationSeconds: 8 // Must be 8s for extension
  }
);
```

#### 2. First/Last Frame Interpolation
Generate videos by specifying start and end frames:

```typescript
const { operation } = await aiService.generateVideo(
  'Smooth transition showing the building from day to night',
  {
    firstFrameImage: {
      imageData: dayImageBase64,
      imageType: 'image/png'
    },
    lastFrameImage: {
      imageData: nightImageBase64,
      imageType: 'image/png'
    },
    durationSeconds: 8 // Must be 8s for interpolation
  }
);
```

#### 3. Reference Images (Up to 3)
Preserve subject appearance across video:

```typescript
const { operation } = await aiService.generateVideo(
  'A cinematic walkthrough of this architectural space',
  {
    referenceImages: [
      { imageData: buildingImage1, imageType: 'image/png', referenceType: 'asset' },
      { imageData: buildingImage2, imageType: 'image/png', referenceType: 'asset' },
      { imageData: personImage, imageType: 'image/png', referenceType: 'person' }
    ],
    durationSeconds: 8 // Must be 8s for reference images
  }
);
```

### Video Cost Optimization Strategy

1. **Use Fast model for iterations**: Start with `veo-3.1-fast-generate-preview` ($0.15/s)
2. **Use Standard for final**: Switch to `veo-3.1-generate-preview` ($0.40/s) only for final output
3. **Shorter durations when possible**: 4s videos cost 50% less than 8s
4. **Optimize prompts**: Better prompts = fewer regenerations = lower total cost
5. **Use extensions**: Extend existing videos instead of generating new ones

**Example Workflow**:
1. Generate 4s Fast video ($0.60) for concept validation
2. If approved, extend to 8s ($0.60 more) = $1.20 total
3. If final quality needed, regenerate 8s Standard ($3.20)

**Total**: $1.20-3.20 vs. $3.20 if starting with Standard

---

## Advanced: Full Multi-Stage Pipeline

Once the simple version works, you can add the full pipeline stages gradually:

1. **Week 1**: Simple prompt optimizer (above) ✅
2. **Week 2**: Add semantic parsing (Stage 1)
3. **Week 3**: Add image understanding (Stage 2)
4. **Week 4**: Add validation (Stage 6)
5. **Week 5**: Add memory extraction (Stage 7)

This incremental approach lets you test and optimize each stage before adding the next.

