# Video Generation Tools Analysis & Expansion Plan

## Current State

### ✅ What We Have
1. **Video Models Configured** (4 models):
   - `veo-3.1-generate-preview` - Standard quality with audio
   - `veo-3.1-fast-generate-preview` - Fast with audio
   - `veo-3.0-generate-001` - Standard without audio
   - `veo-3.0-fast-generate-001` - Fast without audio

2. **Video Generation Infrastructure**:
   - `AISDKService.generateVideo()` - Full video generation service
   - `/api/video` - Dedicated video API endpoint
   - Video support in `/api/renders` route
   - Video generation hooks (`useVideoGeneration`)
   - Video UI components in unified chat interface

3. **Video Capabilities**:
   - Text-to-video generation
   - Image-to-video generation (animate images)
   - Keyframe sequence support
   - Duration: 4, 6, or 8 seconds
   - Resolutions: 720p, 1080p (8s, 16:9 only)
   - Aspect ratios: 16:9, 9:16, 1:1
   - Audio synchronization (Veo 3.1)

### ❌ What's Missing

1. **NO Video Tools in Registry**: All 21 tools have `outputType: 'image'`
2. **No Dedicated Video Tool Pages**: Video generation only accessible via:
   - "Video" button in unified chat (converts current render)
   - Direct API calls
   - No `/apps/video-*` routes

3. **Missing Video Tool Categories**:
   - No "Video Generation" category
   - No specialized video tools for architectural use cases

## Required Video Tools

### 1. **Render to Video / Image Animation** ⭐ HIGH PRIORITY
- **ID**: `render-to-video` or `image-animation`
- **Category**: `transformation` (or new `video` category)
- **Description**: Animate architectural renders with smooth, cinematic motion. Create walkthroughs, time-lapses, and dynamic presentations.
- **Input**: Image (render)
- **Output**: Video
- **Use Cases**:
  - Animate static renders
  - Create walkthrough videos
  - Time-lapse effects
  - Dynamic presentations

### 2. **Text-to-Video Walkthrough** ⭐ HIGH PRIORITY
- **ID**: `text-to-video-walkthrough`
- **Category**: `video` (new category)
- **Description**: Generate architectural walkthrough videos from text descriptions. Create virtual tours, construction sequences, and design presentations.
- **Input**: Text prompt
- **Output**: Video
- **Use Cases**:
  - Virtual property tours
  - Construction progress videos
  - Design concept videos
  - Marketing videos

### 3. **Multi-Angle Video Sequence**
- **ID**: `multi-angle-video`
- **Category**: `diagram` or `video`
- **Description**: Generate videos showing multiple camera angles of an architectural space with smooth transitions.
- **Input**: Image or text
- **Output**: Video
- **Use Cases**:
  - Showcase spaces from multiple perspectives
  - Create dynamic presentations
  - Virtual tours

### 4. **Time-Lapse Generator**
- **ID**: `timelapse-generator`
- **Category**: `video`
- **Description**: Create time-lapse videos showing day-to-night transitions, construction progress, or seasonal changes.
- **Input**: Image or text
- **Output**: Video
- **Use Cases**:
  - Day/night transitions
  - Seasonal changes
  - Construction progress
  - Environmental effects

### 5. **Keyframe Sequence Video**
- **ID**: `keyframe-sequence-video`
- **Category**: `video`
- **Description**: Create smooth video transitions between multiple keyframe images (up to 3 images).
- **Input**: Multiple images (2-3)
- **Output**: Video
- **Use Cases**:
  - Smooth transitions between design variations
  - Before/after sequences
  - Design evolution videos

## Implementation Plan

### Phase 1: Add Video Category & Core Tools
1. Add `'video'` to `ToolCategory` type
2. Add video category to `CATEGORIES` array
3. Add 2-3 core video tools to `TOOLS` array:
   - `render-to-video` (image-to-video)
   - `text-to-video-walkthrough` (text-to-video)
   - `keyframe-sequence-video` (multi-image input)

### Phase 2: Create Tool Pages
1. Create `/app/apps/render-to-video/page.tsx`
2. Create `/app/apps/text-to-video-walkthrough/page.tsx`
3. Create `/app/apps/keyframe-sequence-video/page.tsx`
4. Each page should use `BaseToolComponent` with video-specific settings

### Phase 3: Update Base Tool Component
1. Support `outputType: 'video'` in `BaseToolComponent`
2. Add video-specific settings:
   - Duration selector (4s, 6s, 8s)
   - Aspect ratio selector
   - Model selector (Veo 3.1 Standard/Fast, Veo 3.0 Standard/Fast)
   - Audio toggle (for Veo 3.1)
3. Handle video generation flow
4. Display video preview/player

### Phase 4: Update Unified Chat Interface
1. Ensure video renders display correctly
2. Add video playback controls
3. Support video in render history

### Phase 5: Additional Tools (Future)
1. Multi-angle video sequence
2. Time-lapse generator
3. Video effects/transitions

## Technical Details

### Video Generation Parameters
- **Duration**: 4, 6, or 8 seconds (Veo API requirement)
- **Resolution**: 
  - 720p (default, all durations)
  - 1080p (8s only, 16:9 only)
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Models**:
  - Veo 3.1 Standard: Best quality, with audio
  - Veo 3.1 Fast: Faster, with audio
  - Veo 3.0 Standard: Stable, no audio
  - Veo 3.0 Fast: Fastest, no audio

### Credit Calculation
- Current: 30 credits/second (based on $0.40/second with markup)
- Should use model-specific pricing from `models.ts`:
  - Veo 3.1 Standard: $0.40/second = 16 credits/second
  - Veo 3.1 Fast: $0.15/second = 6 credits/second
  - Veo 3.0 Standard: $0.40/second = 16 credits/second
  - Veo 3.0 Fast: $0.15/second = 6 credits/second

### API Integration
- Use existing `AISDKService.generateVideo()`
- Support all generation types:
  - `text-to-video`
  - `image-to-video`
  - `keyframe-sequence`

## Priority Actions

### ✅ COMPLETED
1. **✅ DONE**: Added `'video'` category to `ToolCategory` type
2. **✅ DONE**: Added video category to `CATEGORIES` array
3. **✅ DONE**: Added 3 core video tools to `TOOLS` array:
   - `render-to-video` (image-to-video, HIGH priority)
   - `text-to-video-walkthrough` (text-to-video, HIGH priority)
   - `keyframe-sequence-video` (multi-image input, MEDIUM priority)

### 🔴 URGENT - Next Steps
1. **HIGH**: Create tool pages for video generation (`/app/apps/render-to-video/page.tsx`, etc.)
2. **HIGH**: Update `BaseToolComponent` to support `outputType: 'video'`
3. **HIGH**: Add video-specific settings to tool pages:
   - Duration selector (4s, 6s, 8s)
   - Aspect ratio selector (16:9, 9:16, 1:1)
   - Model selector (Veo 3.1 Standard/Fast, Veo 3.0 Standard/Fast)
   - Audio toggle (for Veo 3.1 models)
4. **MEDIUM**: Fix credit calculation in `/api/video/route.ts` to use model-specific pricing from `models.ts`
5. **MEDIUM**: Add video playback controls in unified chat interface
6. **LOW**: Add additional specialized video tools (multi-angle, time-lapse)

## Notes

- Video generation is more expensive than images (6-16 credits/second vs 8-48 credits/image)
- Veo 3.1 models support audio synchronization (important for walkthroughs)
- Keyframe sequences allow smooth transitions between design variations
- Duration is limited to 4, 6, or 8 seconds (Veo API constraint)

