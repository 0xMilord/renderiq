# Gemini Model Selector Implementation Plan

## Overview

This document outlines the implementation of a comprehensive model selector system that supports all Gemini image and video generation models with proper credit-based pricing.

## Supported Models

### Image Generation Models

1. **Gemini 3 Pro Image Preview** (`gemini-3-pro-image-preview`)
   - Alias: Nano Banana Pro
   - Pricing: $0.134/image (1K/2K), $0.24/image (4K)
   - Credits: 5 (1K), 10 (2K), 15 (4K)
   - Max Resolution: 4K (4096x4096)
   - Features: Advanced text rendering, grounding with Google Search, thinking mode

2. **Gemini 2.5 Flash Image** (`gemini-2.5-flash-image`)
   - Alias: Nano Banana
   - Pricing: $0.039/image
   - Credits: 5
   - Max Resolution: 1K (1024x1024)
   - Features: Fast generation, good quality

3. **Gemini 2.5 Flash** (`gemini-2.5-flash`)
   - Pricing: $0.30/1M tokens (input), $2.50/1M tokens (output)
   - Credits: Calculated based on tokens
   - Features: Multimodal, fast, cost-effective

4. **Gemini 2.5 Flash-Lite** (`gemini-2.5-flash-lite`)
   - Pricing: $0.10/1M tokens (input), $0.40/1M tokens (output)
   - Credits: Calculated based on tokens
   - Features: Ultra-fast, most cost-effective

5. **Gemini 2.5 Pro** (`gemini-2.5-pro`)
   - Pricing: $1.25/1M tokens (input), $10.00/1M tokens (output)
   - Credits: Calculated based on tokens
   - Features: State-of-the-art thinking model

### Video Generation Models

1. **Veo 3.1 Standard** (`veo-3.1-generate-preview`)
   - Pricing: $0.40/second
   - Credits: 30/second
   - Features: High quality, synchronized audio

2. **Veo 3.1 Fast** (`veo-3.1-fast-generate-preview`)
   - Pricing: $0.15/second
   - Credits: 15/second
   - Features: Fast generation, good quality

3. **Veo 3.0 Standard** (`veo-3.0-generate-001`)
   - Pricing: $0.40/second
   - Credits: 30/second
   - Features: Stable model

4. **Veo 3.0 Fast** (`veo-3.0-fast-generate-001`)
   - Pricing: $0.15/second
   - Credits: 15/second
   - Features: Fast variant

## Implementation Structure

### 1. Model Configuration (`lib/config/models.ts`)

Central configuration file containing:
- Model definitions with metadata
- Pricing information
- Credit calculations
- Model capabilities

### 2. Model Selector Component (`components/ui/model-selector.tsx`)

Reusable component that:
- Displays available models
- Shows credit costs
- Handles model selection
- Displays model capabilities

### 3. Integration Points

#### A. Unified Chat Interface Header
- Location: `components/chat/unified-chat-interface.tsx`
- Position: Next to "More" button in header
- Shows: Current model, credit cost preview

#### B. Canvas Toolbar
- Location: `components/canvas/canvas-toolbar.tsx`
- Position: In toolbar header
- Shows: Model selector for node editor operations

#### C. Base Tool Component
- Location: `components/tools/base-tool-component.tsx`
- Position: In settings panel
- Shows: Model selector with credit usage count

### 4. Service Updates

#### A. AI SDK Service (`lib/services/ai-sdk-service.ts`)
- Update `generateImage()` to accept model parameter
- Update `generateVideo()` to accept model parameter
- Support all model configurations

#### B. Pricing Service (`lib/utils/pricing.ts`)
- Add model-based credit calculation
- Support dynamic pricing based on model selection

#### C. API Routes
- Update `/api/renders` to accept model parameter
- Update `/api/video` to accept model parameter
- Calculate credits based on selected model

## Credit Calculation Formula

### Image Generation
```
Base API Cost (USD) × 2 (markup) × 100 (INR/USD) / 5 (INR/credit) = Credits
```

### Video Generation
```
Base API Cost (USD/second) × 2 (markup) × 100 (INR/USD) / 5 (INR/credit) = Credits/second
```

## User Experience Flow

1. User opens tool/chat/canvas
2. Model selector shows current model (default: Gemini 3 Pro for images, Veo 3.1 for video)
3. User clicks selector to see all available models
4. Each model shows:
   - Name and alias
   - Credit cost
   - Quality level
   - Key features
5. User selects model
6. Credit cost updates in real-time
7. Generation uses selected model

## Backward Compatibility

- Default models remain the same (Gemini 3 Pro, Veo 3.1)
- Existing API calls without model parameter use defaults
- No breaking changes to existing functionality

## Testing Checklist

- [ ] Model selector renders correctly in all locations
- [ ] Credit costs calculate correctly for all models
- [ ] Model selection persists across sessions
- [ ] API routes accept and use model parameter
- [ ] AI SDK service supports all models
- [ ] Error handling for unsupported models
- [ ] UI updates reflect selected model
- [ ] Credit deduction uses correct amounts

## Future Enhancements

- Model recommendations based on use case
- Quality comparison tooltips
- Model performance metrics
- A/B testing framework for model selection
- User preference learning

