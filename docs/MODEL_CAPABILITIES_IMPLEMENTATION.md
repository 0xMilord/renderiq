# Model Capabilities & Constraint Implementation

## Overview

This document describes how model-specific capabilities are enforced in the UI, ensuring users can only select options (like resolution/quality) that are supported by their chosen model.

## Model Capabilities

### Image Generation Models

#### Gemini 3 Pro Image Preview (Nano Banana Pro)
- **Supported Resolutions**: 1K, 2K, 4K
- **Max Resolution**: 4K (4096x4096)
- **Text Rendering**: ✅ Yes
- **Grounding**: ✅ Yes (Google Search)
- **Thinking Mode**: ✅ Yes
- **Image Input**: ✅ Yes (for editing)
- **Style Transfer**: ✅ Yes
- **Aspect Ratios**: All standard ratios (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)

#### Gemini 2.5 Flash Image (Nano Banana)
- **Supported Resolutions**: 1K only
- **Max Resolution**: 1K (1024x1024)
- **Text Rendering**: ❌ No
- **Grounding**: ❌ No
- **Thinking Mode**: ❌ No
- **Image Input**: ✅ Yes (for editing)
- **Style Transfer**: ✅ Yes
- **Aspect Ratios**: All standard ratios (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9)

### Video Generation Models

#### Veo 3.1 Standard
- **Duration**: 4, 6, or 8 seconds
- **Resolution**: 720p (default), 1080p (8s, 16:9 only)
- **Audio**: ✅ Yes (synchronized)
- **Aspect Ratios**: 16:9, 9:16, 1:1

#### Veo 3.1 Fast
- **Duration**: 4, 6, or 8 seconds
- **Resolution**: 720p
- **Audio**: ✅ Yes (synchronized)
- **Aspect Ratios**: 16:9, 9:16, 1:1

## Quality to Resolution Mapping

- **Standard** → 1K (1024x1024)
- **High** → 2K (2048x2048)
- **Ultra** → 4K (4096x4096)

## Implementation Details

### 1. Model Configuration (`lib/config/models.ts`)

Each model has a `capabilities` object that specifies:
- `supportedResolutions`: Array of supported resolutions
- `supportedAspectRatios`: Array of supported aspect ratios
- Feature flags (text rendering, grounding, etc.)

### 2. Helper Functions

```typescript
// Check if model supports a resolution
modelSupportsResolution(modelId, '2K') // returns boolean

// Get all supported resolutions
getSupportedResolutions(modelId) // returns ['1K', '2K', '4K'] or ['1K']

// Check if quality level is supported
modelSupportsQuality(modelId, 'high') // returns boolean

// Get maximum quality supported
getMaxQuality(modelId) // returns 'standard' | 'high' | 'ultra'
```

### 3. UI Behavior

#### Quality Selector
- Options are **disabled** if not supported by selected model
- Shows "Not supported" text for disabled options
- Displays supported resolutions below selector
- Auto-adjusts quality when model changes if current quality is unsupported

#### Model Selector
- Shows model capabilities in tooltip
- Displays credit costs dynamically
- Highlights recommended models

### 4. Validation

#### Client-Side
- Quality selector validates before allowing selection
- Shows error toast if user tries to select unsupported quality
- Auto-adjusts to maximum supported quality when model changes

#### Server-Side
- API validates model + quality combination
- Returns error if invalid combination is requested
- Falls back to default model if invalid model specified

## Example Scenarios

### Scenario 1: User selects Gemini 2.5 Flash Image
1. Model selector shows "Nano Banana" selected
2. Quality selector:
   - ✅ Standard (1K) - enabled
   - ❌ High (2K) - disabled with "Not supported"
   - ❌ Ultra (4K) - disabled with "Not supported"
3. Tooltip shows: "Selected model supports: 1K"
4. If user had "High" selected, it auto-adjusts to "Standard"

### Scenario 2: User selects Gemini 3 Pro Image
1. Model selector shows "Nano Banana Pro" selected
2. Quality selector:
   - ✅ Standard (1K) - enabled
   - ✅ High (2K) - enabled
   - ✅ Ultra (4K) - enabled
3. Tooltip shows: "Selected model supports: 1K, 2K, 4K"
4. All quality options available

## Error Handling

### Invalid Quality Selection
- Toast error: "This quality is not supported by the selected model. Maximum quality: [max]"
- Quality remains unchanged
- User must select supported quality or change model

### Model Change with Unsupported Quality
- Quality auto-adjusts to maximum supported
- Toast info: "Quality adjusted to [quality] (maximum supported by selected model)"
- User can manually change if needed

## Future Enhancements

1. **Smart Recommendations**: Suggest model based on desired quality
2. **Quality Preview**: Show example outputs for each quality level
3. **Cost Comparison**: Show cost difference between models for same quality
4. **Feature Indicators**: Visual badges for model features (text rendering, grounding, etc.)

## Testing Checklist

- [x] Model configuration has accurate capabilities
- [x] Quality selector disables unsupported options
- [x] Auto-adjustment when model changes
- [x] Error messages for invalid selections
- [x] Tooltips show supported resolutions
- [ ] Server-side validation
- [ ] End-to-end testing with all model combinations

