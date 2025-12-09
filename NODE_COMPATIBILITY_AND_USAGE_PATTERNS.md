# Canvas Node Compatibility & Usage Patterns

## Overview

This document provides a comprehensive guide to node compatibility, connection rules, and common usage patterns in the Canvas editor. All nodes follow a **left-to-right flow** where inputs are on the left and outputs are on the right.

---

## Node Type Reference

### Input Nodes (Left Side - Start of Workflow)

#### 1. **Text Node** (`text`)
- **Category**: Input
- **Purpose**: Enter text prompts for generation
- **Inputs**: 
  - `text` (Left) - Optional, allows chaining text nodes
- **Outputs**: 
  - `text` (Right) - Text prompt
- **Connects To**: Image Node, Video Node, Prompt Builder Node
- **Color**: Green (#6bcf33)

#### 2. **Image Input Node** (`image-input`)
- **Category**: Input
- **Purpose**: Upload base images for image-to-image or image-to-video workflows
- **Inputs**: None
- **Outputs**: 
  - `image` (Right) - Base image data
- **Connects To**: Image Node (baseImage), Video Node (baseImage)
- **Color**: Blue (#4a9eff)

#### 3. **Prompt Builder Node** (`prompt-builder`)
- **Category**: Input
- **Purpose**: AI-powered prompt generation using dropdowns
- **Inputs**: None
- **Outputs**: 
  - `prompt` (Right) - Generated text prompt
- **Connects To**: Image Node, Video Node
- **Color**: Cyan (#00d4ff)

---

### Processing Nodes (Middle - Core Operations)

#### 4. **Image Generator Node** (`image`)
- **Category**: Processing
- **Purpose**: Generate images from text prompts, images, or both (hybrid)
- **Inputs** (All on Left):
  - `prompt` (text) - Text prompt for generation
  - `baseImage` (image) - Base image for image-to-image
  - `style` (style) - Style settings
  - `material` (material) - Material settings
- **Outputs**: 
  - `image` (Right) - Generated image
- **Connects From**: Text Node, Image Input Node, Style Node, Material Node, Style Reference Node
- **Connects To**: Variants Node, Video Node, Output Node
- **Color**: Blue (#4a9eff)
- **Modes**:
  - Text-to-Image: Requires `prompt` input
  - Image-to-Image: Requires `baseImage` input
  - Hybrid: Both `prompt` and `baseImage` (iterative operations)

#### 5. **Video Generator Node** (`video`)
- **Category**: Processing
- **Purpose**: Generate videos from text, images, or both
- **Inputs** (All on Left):
  - `prompt` (text) - Text prompt for video
  - `baseImage` (image) - Base image for image-to-video animation
- **Outputs**: 
  - `video` (Right) - Generated video
- **Connects From**: Text Node, Image Input Node, Image Node (for generated images)
- **Connects To**: Output Node
- **Color**: Purple (#9e4aff)
- **Modes**:
  - Text-to-Video: Requires `prompt` input
  - Image-to-Video: Requires `baseImage` input (animates the image)
  - Hybrid: Both `prompt` and `baseImage`

#### 6. **Variants Node** (`variants`)
- **Category**: Processing
- **Purpose**: Generate multiple variations of an image
- **Inputs**:
  - `sourceImage` (image, Left) - Source image to create variants from
- **Outputs**: 
  - `variants` (Right) - Array of variant images
- **Connects From**: Image Node
- **Connects To**: Output Node
- **Color**: Pink (#ff4a9e)

---

### Utility Nodes (Support - Enhance Workflows)

#### 7. **Style Node** (`style`)
- **Category**: Utility
- **Purpose**: Configure camera, lighting, environment, and atmosphere settings
- **Inputs**: None
- **Outputs**: 
  - `style` (Right) - Style configuration
- **Connects To**: Image Node
- **Color**: Orange (#ff9e4a)

#### 8. **Style Reference Node** (`style-reference`)
- **Category**: Utility
- **Purpose**: Extract style from uploaded images
- **Inputs**: None
- **Outputs**: 
  - `style` (Right) - Extracted style configuration
- **Connects To**: Image Node
- **Color**: Amber (#ffb84a)

#### 9. **Material Node** (`material`)
- **Category**: Utility
- **Purpose**: Configure material properties (walls, floors, furniture, etc.)
- **Inputs**: None
- **Outputs**: 
  - `materials` (Right) - Material configuration
- **Connects To**: Image Node
- **Color**: Purple (#9e4aff)

---

### Output Nodes (Right Side - End of Workflow)

#### 10. **Output Node** (`output`)
- **Category**: Output
- **Purpose**: Final destination for images and variants. Can also output images for iterative workflows.
- **Inputs** (All on Left):
  - `image` (image) - Single image
  - `variants` (variants) - Variant images
- **Outputs**: 
  - `image` (Right) - Output image (for iterative workflows)
- **Connects From**: Image Node, Variants Node
- **Connects To**: Image Node (baseImage), Video Node (baseImage) - for iterative loops
- **Color**: Green (#4aff9e)

---

## Type Compatibility Matrix

| Source Type | Can Connect To |
|------------|----------------|
| `text` | `text` inputs (Image Node, Video Node) |
| `image` | `image` inputs (Image Node baseImage, Video Node baseImage, Variants Node sourceImage, Output Node) |
| `style` | `style` inputs (Image Node) |
| `material` | `material` inputs (Image Node) |
| `variants` | `variants` inputs (Output Node) |

### Connection Rules

1. **Exact Type Match**: Most connections require exact type matching
2. **Multiple Inputs**: Nodes can accept multiple inputs simultaneously (e.g., Image Node can have both `prompt` and `baseImage`)
3. **No Cycles**: Connections cannot create circular dependencies
4. **Left-to-Right Flow**: Data flows from left (inputs) to right (outputs)

---

## Common Usage Patterns

### Pattern 1: Simple Text-to-Image
```
Text Node → Image Node → Output Node
```
**Use Case**: Basic image generation from text prompt

### Pattern 2: Styled Generation
```
Text Node ──┐
            ├→ Image Node → Output Node
Style Node ─┘
```
**Use Case**: Generate image with specific camera, lighting, and atmosphere settings

### Pattern 3: Image-to-Image (Iterative Editing)
```
Image Input Node ──┐
                   ├→ Image Node → Output Node
Text Node ─────────┘
```
**Use Case**: Modify an existing image with text guidance (iterative operations)

### Pattern 4: Image-to-Video (Animate Image)
```
Image Node → Video Node → Output Node
```
**Use Case**: Convert a generated image into an animated video

### Pattern 5: Image-to-Video (Animate Uploaded Image)
```
Image Input Node ──┐
                   ├→ Video Node → Output Node
Text Node ─────────┘
```
**Use Case**: Animate an uploaded image with optional text guidance

### Pattern 6: Complete Workflow with Variants
```
Text Node ──┐
            ├→ Image Node ──┐
Style Node ─┘               │
                            ├→ Variants Node → Output Node
Material Node ──────────────┘
```
**Use Case**: Generate styled image, then create multiple variations

### Pattern 7: Style Extraction Workflow
```
Image Input Node → Style Reference Node ──┐
                                          ├→ Image Node → Output Node
Text Node ────────────────────────────────┘
```
**Use Case**: Extract style from reference image, apply to new generation

### Pattern 8: AI-Powered Prompt Generation
```
Prompt Builder Node → Image Node → Output Node
```
**Use Case**: Use AI to generate prompts, then create images

### Pattern 9: Hybrid Image-to-Image with Style
```
Image Input Node ──┐
                   ├→ Image Node ──┐
Text Node ─────────┘               │
                                   ├→ Variants Node → Output Node
Style Node ────────────────────────┘
```
**Use Case**: Iterative editing with style guidance and variant generation

### Pattern 10: Video from Generated Image
```
Text Node → Image Node → Video Node → Output Node
```
**Use Case**: Generate image first, then animate it into video

### Pattern 11: Iterative Image Refinement (Continuous Loop)
```
Text Node ──┐
            ├→ Image Node → Output Node ──┐
Style Node ─┘                             │
                                          │ (connect manually)
                                          └→ Image Node → Output Node → ...
```
**Use Case**: Continuously refine images by feeding output back as input for iterative improvements

### Pattern 12: Iterative Video from Refined Images
```
Text Node → Image Node → Output Node → Image Node → Video Node → Output Node
```
**Use Case**: Generate image, refine it iteratively, then convert final version to video

---

## Node Audit Results

### ✅ Connection Handling Status

#### Image Node
- ✅ Accepts `text` from Text Node → `prompt` input
- ✅ Accepts `image` from Image Input Node → `baseImage` input
- ✅ Accepts `image` from Image Node output → `baseImage` input (for iterative operations)
- ✅ Accepts `style` from Style Node → `style` input
- ✅ Accepts `style` from Style Reference Node → `style` input
- ✅ Accepts `material` from Material Node → `material` input
- ✅ Outputs `image` to Variants Node, Video Node, Output Node
- ✅ Supports simultaneous connections (text + image + style + material)

#### Video Node
- ✅ Accepts `text` from Text Node → `prompt` input
- ✅ Accepts `text` from Prompt Builder Node → `prompt` input
- ✅ Accepts `image` from Image Input Node → `baseImage` input
- ✅ Accepts `image` from Image Node output → `baseImage` input (FIXED)
- ✅ Outputs `video` to Output Node
- ✅ Supports simultaneous connections (text + image)

#### Variants Node
- ✅ Accepts `image` from Image Node → `sourceImage` input
- ✅ Outputs `variants` to Output Node

#### Output Node
- ✅ Accepts `image` from Image Node → `image` input
- ✅ Accepts `variants` from Variants Node → `variants` input
- ✅ Outputs `image` to Image Node (baseImage), Video Node (baseImage) - for iterative workflows

#### Text Node
- ✅ Outputs `text` to Image Node, Video Node
- ✅ Can chain to other Text Nodes (optional)

#### Image Input Node
- ✅ Outputs `image` to Image Node, Video Node

#### Style Node
- ✅ Outputs `style` to Image Node

#### Style Reference Node
- ✅ Outputs `style` to Image Node

#### Material Node
- ✅ Outputs `material` to Image Node

#### Prompt Builder Node
- ✅ Outputs `text` to Image Node, Video Node

---

## Issues Found

### ✅ FIXED: Video Node Now Accepts Generated Images

**Problem**: The Video Node connection handling did not support receiving images from Image Node output. This prevented the workflow: `Image Node → Video Node` (converting generated images to video).

**Fix Applied**:
- Added connection handling for Image Node output → Video Node baseImage input
- Updated video generation to handle both base64 data and URLs (from Image Node output)
- Video Node now supports: `Image Node → Video Node` workflow

**Location**: 
- `components/canvas/canvas-editor.tsx` - Video node connection handling
- `lib/hooks/use-node-execution.ts` - Video generation URL handling

---

## Left-to-Right Flow Verification

### ✅ Flow is Proper

All nodes follow the correct left-to-right flow:

1. **Input Nodes** (Left side only):
   - Text Node, Image Input Node, Prompt Builder Node
   - Style Node, Style Reference Node, Material Node (utility inputs)

2. **Processing Nodes** (Both sides):
   - Image Node, Video Node, Variants Node
   - Inputs on left, outputs on right

3. **Output Nodes** (Right side only):
   - Output Node
   - Only inputs, no outputs

### Handle Positioning

- ✅ All inputs: Left side (`Position.Left`)
- ✅ All outputs: Right side (`Position.Right`)
- ✅ Multiple inputs on left are vertically spaced (20px apart)
- ✅ Handles are 8px (12px when connected)
- ✅ Handles positioned half-in/half-out on card edges

---

## Recommendations

1. **Fix Video Node Connection**: Add support for Image Node → Video Node connection
2. **Documentation**: Add visual diagrams for each usage pattern
3. **Validation**: Add runtime validation to ensure required inputs are connected
4. **Templates**: Create more node templates for common workflows
5. **Error Messages**: Improve error messages when connections are invalid

---

## Quick Reference: What Connects to What

### Image Node Inputs
- `prompt` ← Text Node, Prompt Builder Node
- `baseImage` ← Image Input Node, Image Node (output), **Output Node (output)** ✅ **NEW**
- `style` ← Style Node, Style Reference Node
- `material` ← Material Node

### Video Node Inputs
- `prompt` ← Text Node, Prompt Builder Node
- `baseImage` ← Image Input Node, Image Node (output), **Output Node (output)** ✅ **NEW**

### Variants Node Inputs
- `sourceImage` ← Image Node

### Output Node Inputs
- `image` ← Image Node
- `variants` ← Variants Node

### Output Node Outputs
- `image` → Image Node (baseImage), Video Node (baseImage) - for iterative workflows

---

## Iterative Workflows (Continuous/Repetitive Process)

### How It Works

The Output Node now has an **output handle** that allows you to feed the final generated image back into the workflow for continuous refinement:

1. **Generate Image**: Image Node → Output Node
2. **Feed Back**: Output Node → Image Node (baseImage input)
3. **Refine**: Generate new image with modifications
4. **Repeat**: Connect Output Node → Image Node again for further iterations

### Example: Iterative Image Refinement

```
Iteration 1:
Text Node → Image Node → Output Node

Iteration 2 (connect Output to new Image Node):
Text Node ──┐
            ├→ Image Node → Output Node
Output Node ┘ (from previous iteration)
```

### Use Cases

- **Continuous Refinement**: Keep improving an image through multiple iterations
- **Style Evolution**: Gradually change style by modifying prompts between iterations
- **Progressive Enhancement**: Add details incrementally
- **A/B Testing**: Create variations by changing prompts while keeping the base image

### Important Notes

- **Manual Connection Required**: You need to manually connect Output Node → Image Node for each iteration
- **No Automatic Loops**: The system prevents automatic cycles to avoid infinite loops
- **Data Flow**: Output Node passes the image URL to Image Node's baseImage input
- **Works with Video**: Output Node → Video Node also works for iterative video generation

---

## Version History

- **2025-01-XX**: Initial documentation created
- **2025-01-XX**: Added Video Node audit, fixed connection issue
- **2025-01-XX**: Added Output Node output capability for iterative workflows

