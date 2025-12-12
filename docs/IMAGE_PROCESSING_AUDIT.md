# Image Processing Best Practices Audit

## Date: 2025-01-27

## Overview

This document audits our 7-stage pipeline's image processing implementation against Google's Gemini API best practices for handling images (uploaded images and style references).

## Google's Best Practices (from Documentation)

### 1. Image/Text Order
**Best Practice**: "When using a single image with text, place the text prompt **after** the image part in the `contents` array."

**Rationale**: This improves model understanding and accuracy by allowing the model to process visual context before the text instruction.

### 2. Multiple Images
- Can provide multiple images in a single prompt
- Can mix inline data and File API references
- Images should come before text prompt

### 3. Image Format Support
Gemini supports:
- PNG - `image/png`
- JPEG - `image/jpeg`
- WEBP - `image/webp`
- HEIC - `image/heic`
- HEIF - `image/heif`

### 4. Inline vs File API
- **Inline Data**: Ideal for smaller files (<20MB total request size)
- **File API**: Recommended for larger files or reusing images across multiple requests

### 5. Token Calculation
- **Gemini 2.5 Flash/Pro**: 258 tokens if both dimensions ≤ 384 pixels
- Larger images are tiled into 768x768 pixel tiles, each costing 258 tokens

## Current Implementation Audit

### ✅ Stage 2: Image Understanding (`lib/services/image-understanding.ts`)

**Status**: ✅ **FIXED** - Now follows best practices

**Implementation**:
- Uses `generateTextWithImage()` which now places image BEFORE text
- Uses inline data format (Base64 encoded strings)
- Supports structured outputs (JSON Schema)
- Handles both reference images and style references

**Code Location**: `lib/services/image-understanding.ts:100`

### ✅ Stage 3: Prompt Optimization (`lib/services/prompt-optimizer.ts`)

**Status**: ✅ **No images passed directly** - Uses analysis results from Stage 2

**Implementation**:
- Does not pass images directly to the model
- Uses `ImageAnalysis` results from Stage 2
- Text-only optimization (no image order issues)

### ✅ Simple Prompt Optimizer (`lib/services/simple-prompt-optimizer.ts`)

**Status**: ✅ **FIXED** - Now follows best practices

**Implementation**:
- Uses `generateTextWithMultipleImages()` which now places images BEFORE text
- Handles multiple reference images correctly
- Uses inline data format

**Code Location**: `lib/services/simple-prompt-optimizer.ts:195-206`

### ✅ Video Prompt Optimizer (`lib/services/video-prompt-optimizer.ts`)

**Status**: ✅ **FIXED** - Now follows best practices

**Implementation**:
- Uses `generateTextWithMultipleImages()` which now places images BEFORE text
- Handles up to 3 reference images (Veo limit)
- Uses inline data format

**Code Location**: `lib/services/video-prompt-optimizer.ts:103-115`

### ✅ Stage 5: Image Generation (`lib/services/ai-sdk-service.ts:generateImage`)

**Status**: ⚠️ **Needs Review** - Image generation may have different requirements

**Implementation**:
- Currently places text prompt first, then images
- For image generation (not analysis), order may be less critical
- Uses inline data format for uploaded image and style transfer image

**Code Location**: `lib/services/ai-sdk-service.ts:278-304`

**Note**: For image generation, the prompt typically describes what to generate, so text-first order may be acceptable. However, we should verify with Google's documentation for image generation models.

### ✅ Core Image Processing Methods

#### `generateTextWithImage()` (`lib/services/ai-sdk-service.ts:1057`)

**Status**: ✅ **FIXED** - Now follows best practices

**Before**:
```typescript
const contents: any[] = [{ text: prompt }];
if (imageData && imageType) {
  contents.push({ inlineData: { ... } });
}
```

**After**:
```typescript
const contents: any[] = [];
if (imageData && imageType) {
  contents.push({ inlineData: { ... } });
}
contents.push({ text: prompt }); // Image BEFORE text
```

#### `generateTextWithMultipleImages()` (`lib/services/ai-sdk-service.ts:1106`)

**Status**: ✅ **FIXED** - Now follows best practices

**Before**:
```typescript
const contents: any[] = [{ text: prompt }];
for (const img of images) {
  contents.push({ inlineData: { ... } });
}
```

**After**:
```typescript
const contents: any[] = [];
for (const img of images) {
  contents.push({ inlineData: { ... } });
}
contents.push({ text: prompt }); // Images BEFORE text
```

## Image Format Support

### ✅ Current Support
- ✅ PNG (`image/png`)
- ✅ JPEG (`image/jpeg`)
- ✅ WEBP (`image/webp`) - Supported by Gemini
- ⚠️ HEIC/HEIF - Not explicitly validated, but Gemini supports them

### Recommendations
1. Add explicit validation for supported MIME types
2. Add conversion logic for unsupported formats
3. Document supported formats in error messages

## Inline Data vs File API

### Current Implementation
- ✅ Uses inline data (Base64 encoded strings)
- ✅ Appropriate for our use case (<20MB per request)
- ⚠️ No File API implementation for large/repeated images

### Recommendations
1. **Short-term**: Continue using inline data (fits our use case)
2. **Long-term**: Consider File API for:
   - Large images (>10MB)
   - Images reused across multiple requests
   - Style references used repeatedly

## Token Calculation & Optimization

### Current Implementation
- ✅ Uses Gemini 2.5 Flash for analysis (cost-effective)
- ✅ Limits image count appropriately (3 for Veo, 5 for analysis)
- ⚠️ No explicit image size optimization

### Recommendations
1. Add image size validation/optimization before sending to API
2. Consider resizing very large images to reduce token costs
3. Document token costs in logs for monitoring

## Stage-by-Stage Compliance

| Stage | Service | Image Order | Format | Status |
|-------|---------|-------------|--------|--------|
| Stage 2 | ImageUnderstandingService | ✅ Image → Text | ✅ Inline | ✅ Fixed |
| Stage 3 | PromptOptimizer | N/A (text only) | N/A | ✅ OK |
| Stage 3 | SimplePromptOptimizer | ✅ Images → Text | ✅ Inline | ✅ Fixed |
| Stage 5 | AISDKService.generateImage | ⚠️ Text → Images | ✅ Inline | ⚠️ Review |
| Video | VideoPromptOptimizer | ✅ Images → Text | ✅ Inline | ✅ Fixed |

## Summary of Changes Made

1. ✅ **Fixed `generateTextWithImage()`**: Image now comes before text
2. ✅ **Fixed `generateTextWithMultipleImages()`**: Images now come before text
3. ✅ **Fixed `SimplePromptOptimizer`**: Images now come before text
4. ✅ **Fixed `VideoPromptOptimizer`**: Images now come before text
5. ⚠️ **Review `generateImage()`**: Image generation may have different requirements

## Next Steps

1. ✅ **Completed**: Fixed image/text order in all analysis methods
2. ⚠️ **Review**: Verify image generation order requirements
3. 📋 **Future**: Consider File API for large/repeated images
4. 📋 **Future**: Add image format validation
5. 📋 **Future**: Add image size optimization

## Testing Recommendations

1. Test with single image + text (Stage 2)
2. Test with multiple images + text (Stage 2, SimplePromptOptimizer)
3. Test with style reference + uploaded image (Stage 5)
4. Verify improved accuracy after order fix
5. Monitor token usage and costs

## References

- [Google Gemini Image Understanding Guide](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Google Gemini Files API Guide](https://ai.google.dev/gemini-api/docs/files)
- [Google Gemini Media Resolution Guide](https://ai.google.dev/gemini-api/docs/media-resolution)

