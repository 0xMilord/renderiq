# Image Generation Infrastructure Audit

**Date**: 2025-01-27  
**Scope**: Complete audit of image generation infrastructure against Gemini Image Generation API documentation  
**Reference**: [Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)

## Executive Summary

This audit evaluates the current image generation implementation against the official Gemini Image Generation API documentation. The infrastructure supports basic image generation features but is **missing critical multi-turn conversational capabilities** and advanced features like Google Search grounding.

### Overall Alignment Score: 65/100

**✅ Strengths:**
- Basic text-to-image generation
- Image editing (text-and-image-to-image)
- Aspect ratio and resolution support (1K, 2K, 4K)
- Multiple image inputs (uploaded + style transfer)
- Model selection (Gemini 3 Pro vs 2.5 Flash)

**❌ Critical Gaps:**
- No chat-based multi-turn image editing
- No thought signature handling
- No Google Search grounding support
- Limited to 2 images (not 14)
- No interleaved text/image responses
- No conversation history management

---

## Detailed Feature Analysis

### 1. Text-to-Image Generation ✅

**Status**: ✅ **IMPLEMENTED**

**Current Implementation:**
- `lib/services/ai-sdk-service.ts:198-500` - `generateImage()` method
- Uses `genAI.models.generateContent()` with image models
- Supports both `gemini-2.5-flash-image` and `gemini-3-pro-image-preview`

**Code Reference:**
```358:362:lib/services/ai-sdk-service.ts
      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });
```

**Alignment**: ✅ Matches documentation pattern for basic text-to-image generation.

**Recommendations**: None - implementation is correct.

---

### 2. Image Editing (Text-and-Image-to-Image) ✅

**Status**: ✅ **IMPLEMENTED**

**Current Implementation:**
- Supports `uploadedImageData` parameter for base image
- Supports `styleTransferImageData` for style reference
- Combines text prompt with image inputs

**Code Reference:**
```281:299:lib/services/ai-sdk-service.ts
      // Add uploaded image (main image being edited) if provided
      if (request.uploadedImageData && request.uploadedImageType) {
        contents.push({
          inlineData: {
            mimeType: request.uploadedImageType,
            data: request.uploadedImageData
          }
        });
      }
      
      // Add style transfer image if provided
      if (request.styleTransferImageData && request.styleTransferImageType) {
        contents.push({
          inlineData: {
            mimeType: request.styleTransferImageType,
            data: request.styleTransferImageData
          }
        });
      }
```

**Alignment**: ✅ Matches documentation for image editing.

**Recommendations**: None - implementation is correct.

---

### 3. Multi-Turn Image Editing ❌

**Status**: ❌ **NOT IMPLEMENTED**

**Documentation Requirement:**
- Use `chats.create()` to create a chat session
- Use `chat.sendMessage()` for iterative refinement
- Maintain conversation history across turns
- Support conversational prompts like "Update this infographic to be in Spanish"

**Current Implementation:**
- Uses `generateContent()` for each request (stateless)
- No chat session management
- No conversation history preservation
- Each request is independent

**Missing Code Pattern:**
```javascript
// From docs - Python example
chat = client.chats.create(
    model="gemini-3-pro-image-preview",
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        tools=[{"google_search": {}}]
    )
)

response = chat.send_message(message)
```

**Impact**: **HIGH** - Users cannot iteratively refine images conversationally. Each edit is a fresh generation, losing context.

**Recommendations**:
1. Implement chat session management in `AISDKService`
2. Store chat sessions per render chain
3. Add `chatId` parameter to `generateImage()` for multi-turn support
4. Use `chats.create()` and `chat.sendMessage()` for iterative edits

**Files to Modify**:
- `lib/services/ai-sdk-service.ts` - Add `createImageChat()` and `sendImageChatMessage()` methods
- `app/api/renders/route.ts` - Support chat-based generation when `chainId` is provided
- `lib/dal/render-chains.ts` - Store chat session state

---

### 4. Aspect Ratio and Resolution Support ✅

**Status**: ✅ **IMPLEMENTED**

**Current Implementation:**
- Supports all 10 aspect ratios: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- Supports resolutions: `1K`, `2K`, `4K`
- Maps quality levels to resolutions: `ultra` → `4K`, `high` → `2K`, `standard` → `1K`

**Code Reference:**
```305:356:lib/services/ai-sdk-service.ts
      // Map aspect ratio to valid format
      const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
      const aspectRatio = validAspectRatios.includes(request.aspectRatio) 
        ? request.aspectRatio 
        : '16:9';

      // For Gemini 3 Pro Image, determine image size based on mediaResolution request
      // Map mediaResolution to imageSize: HIGH -> 4K (for upscaling), MEDIUM -> 2K, LOW -> 1K
      // Use imageSize if provided directly, otherwise map from mediaResolution
      // imageSize takes precedence as it's the direct parameter for Gemini image generation
      let imageSize: '1K' | '2K' | '4K' = '1K'; // Default to 1K
      if (request.imageSize) {
        imageSize = request.imageSize; // Use direct imageSize parameter (preferred)
      } else if (request.mediaResolution === 'HIGH') {
        imageSize = '4K'; // Use 4K for high quality requests (upscaling, maximum detail)
      } else if (request.mediaResolution === 'MEDIUM') {
        imageSize = '2K'; // Use 2K for medium quality
      } else {
        imageSize = '1K'; // Default to 1K for LOW or UNSPECIFIED
      }

      // gemini-2.5-flash-image only supports 1K resolution
      // Force 1K for this model regardless of request
      const isFlashImage = modelName === 'gemini-2.5-flash-image';
      if (isFlashImage) {
        imageSize = '1K';
      }

      logger.log('🎨 AISDKService: Calling Gemini Native Image Generation...', {
        model: modelName,
        aspectRatio,
        imageSize,
        contentsCount: contents.length,
        note: isFlashImage ? 'Using Gemini 2.5 Flash Image (Nano Banana)' : 'Using Gemini 3 Pro Image Preview (Nano Banana Pro)'
      });

      // Generate image using Gemini Native Image Generation
      // For image generation models, use imageConfig with aspectRatio and imageSize
      // DO NOT use mediaResolution - it's only for multimodal models processing input media
      // Note: gemini-2.5-flash-image may not support imageSize parameter, so we conditionally include it
      const config: {
        responseModalities: string[];
        imageConfig: { aspectRatio: string; imageSize?: string };
      } = {
        responseModalities: ['IMAGE'], // Only return image, no text
        imageConfig: {
          aspectRatio: aspectRatio,
          // Only include imageSize for models that support it (gemini-3-pro-image-preview)
          // gemini-2.5-flash-image only supports 1K and may not accept this parameter
          ...(isFlashImage ? {} : { imageSize: imageSize })
        }
      };
```

**Alignment**: ✅ Fully aligned with documentation.

**Recommendations**: None - implementation is correct.

---

### 5. Multiple Reference Images (Up to 14) ⚠️

**Status**: ⚠️ **PARTIALLY IMPLEMENTED**

**Documentation Requirement:**
- Gemini 3 Pro Image supports up to 14 reference images:
  - Up to 6 images of objects with high-fidelity
  - Up to 5 images of humans for character consistency

**Current Implementation:**
- Supports only 2 images:
  - `uploadedImageData` (main image)
  - `styleTransferImageData` (style reference)

**Code Reference:**
```281:299:lib/services/ai-sdk-service.ts
      // Add uploaded image (main image being edited) if provided
      if (request.uploadedImageData && request.uploadedImageType) {
        contents.push({
          inlineData: {
            mimeType: request.uploadedImageType,
            data: request.uploadedImageData
          }
        });
      }
      
      // Add style transfer image if provided
      if (request.styleTransferImageData && request.styleTransferImageType) {
        contents.push({
          inlineData: {
            mimeType: request.styleTransferImageType,
            data: request.styleTransferImageData
          }
        });
      }
```

**Impact**: **MEDIUM** - Cannot leverage full multi-image composition capabilities.

**Recommendations**:
1. Add `referenceImages` array parameter (up to 14 images)
2. Support image categorization (objects vs humans)
3. Update API route to accept multiple reference images

**Files to Modify**:
- `lib/services/ai-sdk-service.ts` - Add `referenceImages?: Array<{imageData: string; imageType: string; category?: 'object' | 'human'}>` parameter
- `app/api/renders/route.ts` - Parse multiple reference images from formData

---

### 6. Response Modalities ⚠️

**Status**: ⚠️ **PARTIALLY IMPLEMENTED**

**Documentation Requirement:**
- Support `responseModalities: ['TEXT', 'IMAGE']` for interleaved responses
- Support `responseModalities: ['IMAGE']` for image-only responses

**Current Implementation:**
- Always uses `responseModalities: ['IMAGE']` (image-only)

**Code Reference:**
```345:356:lib/services/ai-sdk-service.ts
      const config: {
        responseModalities: string[];
        imageConfig: { aspectRatio: string; imageSize?: string };
      } = {
        responseModalities: ['IMAGE'], // Only return image, no text
        imageConfig: {
          aspectRatio: aspectRatio,
          // Only include imageSize for models that support it (gemini-3-pro-image-preview)
          // gemini-2.5-flash-image only supports 1K and may not accept this parameter
          ...(isFlashImage ? {} : { imageSize: imageSize })
        }
      };
```

**Impact**: **LOW** - Current implementation works but misses text explanations.

**Recommendations**:
1. Add `includeText?: boolean` parameter to `generateImage()`
2. Set `responseModalities: ['TEXT', 'IMAGE']` when `includeText` is true
3. Extract and return text parts from response

**Files to Modify**:
- `lib/services/ai-sdk-service.ts` - Add text extraction logic
- `app/api/renders/route.ts` - Return text explanations if available

---

### 7. Google Search Grounding ❌

**Status**: ❌ **NOT IMPLEMENTED**

**Documentation Requirement:**
- Use `tools: [{"google_search": {}}]` in config
- Generate images based on real-time information (weather, stock charts, events)
- Returns `groundingMetadata` with search sources

**Current Implementation:**
- No Google Search tool configuration
- No grounding metadata handling

**Missing Code Pattern:**
```javascript
// From docs
config: {
  responseModalities: ['TEXT', 'IMAGE'],
  tools: [{"google_search": {}}],
  imageConfig: {
    aspectRatio: "16:9"
  }
}
```

**Impact**: **MEDIUM** - Cannot generate images based on real-time data.

**Recommendations**:
1. Add `enableGrounding?: boolean` parameter to `generateImage()`
2. Include `tools: [{"google_search": {}}]` when enabled
3. Extract and return `groundingMetadata` from response
4. Update model config to indicate grounding support

**Files to Modify**:
- `lib/services/ai-sdk-service.ts` - Add grounding support
- `lib/config/models.ts` - Already has `supportsGrounding: true` for Gemini 3 Pro ✅
- `app/api/renders/route.ts` - Pass grounding flag from request

---

### 8. Thought Signatures ❌

**Status**: ❌ **NOT IMPLEMENTED**

**Documentation Requirement:**
- Gemini 3 Pro Image uses "thinking" process for complex prompts
- Responses include `thought_signature` fields on image parts
- Must pass thought signatures back in conversation history
- SDKs handle this automatically when using chat feature

**Current Implementation:**
- Uses `generateContent()` (stateless) - no thought signature handling
- No conversation history management

**Impact**: **HIGH** - If implementing chat-based multi-turn, thought signatures are critical for maintaining context.

**Recommendations**:
1. When implementing chat-based multi-turn, use SDK's chat feature (handles thought signatures automatically)
2. Do NOT manually extract/manage thought signatures - let SDK handle it
3. Always pass full model response object to chat history

**Files to Modify**:
- `lib/services/ai-sdk-service.ts` - Use `chats.create()` and `chat.sendMessage()` (SDK handles thought signatures)

---

### 9. Model Selection ✅

**Status**: ✅ **IMPLEMENTED**

**Current Implementation:**
- Supports `gemini-3-pro-image-preview` (default)
- Supports `gemini-2.5-flash-image`
- Model selection via `model` parameter

**Code Reference:**
```301:303:lib/services/ai-sdk-service.ts
      // Use specified model or default to Gemini 3 Pro Image Preview (Nano Banana Pro)
      // This model supports up to 4K resolution and advanced features
      const modelName = request.model || 'gemini-3-pro-image-preview';
```

**Alignment**: ✅ Correct model selection.

**Recommendations**: None - implementation is correct.

---

### 10. Interleaved Text and Image Responses ❌

**Status**: ❌ **NOT IMPLEMENTED**

**Documentation Requirement:**
- Support prompts that generate both text and images
- Example: "Generate an illustrated recipe for a paella" → text + images

**Current Implementation:**
- Always uses `responseModalities: ['IMAGE']`
- No text extraction from responses

**Impact**: **LOW** - Not a critical feature for current use case.

**Recommendations**: Same as #6 (Response Modalities).

---

## Implementation Gaps Summary

### Critical (Must Fix)

1. **Multi-Turn Image Editing** ❌
   - **Impact**: HIGH
   - **Effort**: MEDIUM
   - **Priority**: P0
   - **Files**: `lib/services/ai-sdk-service.ts`, `app/api/renders/route.ts`

2. **Thought Signature Handling** ❌
   - **Impact**: HIGH (when implementing multi-turn)
   - **Effort**: LOW (SDK handles it automatically with chat)
   - **Priority**: P0 (when implementing multi-turn)
   - **Files**: `lib/services/ai-sdk-service.ts`

### Important (Should Fix)

3. **Google Search Grounding** ❌
   - **Impact**: MEDIUM
   - **Effort**: LOW
   - **Priority**: P1
   - **Files**: `lib/services/ai-sdk-service.ts`, `app/api/renders/route.ts`

4. **Multiple Reference Images (14 max)** ⚠️
   - **Impact**: MEDIUM
   - **Effort**: MEDIUM
   - **Priority**: P1
   - **Files**: `lib/services/ai-sdk-service.ts`, `app/api/renders/route.ts`

### Nice to Have

5. **Interleaved Text/Image Responses** ⚠️
   - **Impact**: LOW
   - **Effort**: LOW
   - **Priority**: P2
   - **Files**: `lib/services/ai-sdk-service.ts`

---

## Recommended Implementation Plan

### Phase 1: Multi-Turn Image Editing (P0)

**Goal**: Enable conversational image refinement

**Steps**:
1. Add `createImageChat()` method to `AISDKService`
2. Add `sendImageChatMessage()` method for iterative edits
3. Store chat sessions per render chain
4. Update API route to use chat when `chainId` is provided
5. Preserve conversation history across turns

**Code Structure**:
```typescript
// lib/services/ai-sdk-service.ts
async createImageChat(model: string, config: {
  aspectRatio: string;
  imageSize?: '1K' | '2K' | '4K';
  enableGrounding?: boolean;
}): Promise<ChatSession> {
  const chatConfig = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: config.aspectRatio,
      ...(config.imageSize && { imageSize: config.imageSize })
    },
    ...(config.enableGrounding && { tools: [{"google_search": {}}] })
  };
  
  const chat = await this.genAI.chats.create({
    model: model,
    config: chatConfig
  });
  
  return { chat, model, config };
}

async sendImageChatMessage(
  chat: ChatSession,
  message: string,
  images?: Array<{imageData: string; imageType: string}>
): Promise<ImageGenerationResult> {
  const contents: any[] = [{ text: message }];
  
  if (images) {
    for (const img of images) {
      contents.push({
        inlineData: {
          mimeType: img.imageType,
          data: img.imageData
        }
      });
    }
  }
  
  const response = await chat.chat.sendMessage({ message: contents });
  
  // Extract image and text from response
  // SDK automatically handles thought signatures
  // ...
}
```

### Phase 2: Google Search Grounding (P1)

**Goal**: Enable real-time data-based image generation

**Steps**:
1. Add `enableGrounding` parameter to `generateImage()`
2. Include `tools: [{"google_search": {}}]` in config when enabled
3. Extract `groundingMetadata` from response
4. Return grounding sources to client

### Phase 3: Multiple Reference Images (P1)

**Goal**: Support up to 14 reference images

**Steps**:
1. Add `referenceImages` array parameter
2. Support image categorization (objects vs humans)
3. Update API route to parse multiple images
4. Validate image count limits (6 objects, 5 humans)

### Phase 4: Interleaved Responses (P2)

**Goal**: Support text + image responses

**Steps**:
1. Add `includeText` parameter
2. Set `responseModalities: ['TEXT', 'IMAGE']` when enabled
3. Extract text parts from response
4. Return both text and image to client

---

## Testing Checklist

### Multi-Turn Image Editing
- [ ] Create chat session for render chain
- [ ] Send initial image generation request
- [ ] Send follow-up edit request (e.g., "Make it Spanish")
- [ ] Verify conversation history is preserved
- [ ] Verify thought signatures are handled automatically
- [ ] Test multiple sequential edits

### Google Search Grounding
- [ ] Generate image with grounding enabled
- [ ] Verify `groundingMetadata` is returned
- [ ] Test with real-time data prompts (weather, events)
- [ ] Verify search sources are included

### Multiple Reference Images
- [ ] Test with 2 images (current limit)
- [ ] Test with 6 object images
- [ ] Test with 5 human images
- [ ] Test with 14 total images (6 objects + 5 humans + 3 others)
- [ ] Verify image categorization works

### Response Modalities
- [ ] Test image-only response (current)
- [ ] Test text + image response
- [ ] Verify text is extracted correctly
- [ ] Verify both text and image are returned

---

## Conclusion

The current image generation infrastructure is **functionally correct** for basic use cases but **lacks advanced conversational capabilities** that would significantly improve user experience. The most critical gap is **multi-turn image editing**, which would enable users to iteratively refine images through conversation rather than starting fresh each time.

**Recommended Priority**:
1. **P0**: Implement multi-turn image editing (chat-based)
2. **P1**: Add Google Search grounding
3. **P1**: Support multiple reference images (up to 14)
4. **P2**: Support interleaved text/image responses

**Estimated Effort**:
- Phase 1 (Multi-Turn): 2-3 days
- Phase 2 (Grounding): 1 day
- Phase 3 (Multiple Images): 2 days
- Phase 4 (Interleaved): 1 day
- **Total**: ~1 week for full alignment

---

## References

- [Gemini Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Multi-Turn Image Editing Example](https://ai.google.dev/gemini-api/docs/image-generation#multi-turn-image-editing)
- [Google Search Grounding](https://ai.google.dev/gemini-api/docs/image-generation#grounding-with-google-search)
- [Thought Signatures](https://ai.google.dev/gemini-api/docs/thought-signatures)

