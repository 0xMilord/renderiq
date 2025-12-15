# SketchUp Plugin Development Plan

## Overview

Create a SketchUp plugin that integrates Renderiq's AI rendering capabilities directly into SketchUp. Users can capture screenshots from their 3D models and generate photorealistic renders using system prompts and settings (no user prompt required).

## Features

1. **Camera Position Management**
   - Save current camera position
   - Load saved camera positions
   - List all saved positions
   - Delete saved positions

2. **Screenshot Capture**
   - Capture current view as image
   - Export at different resolutions
   - Support for transparent backgrounds (if available)

3. **Real-time Rendering**
   - Send captured image to Renderiq API
   - Use system prompts (no user input required)
   - Configure settings via UI (quality, style, aspect ratio, etc.)
   - Display rendered result in SketchUp
   - Download rendered images

4. **Integration with Renderiq /apps Infrastructure**
   - Similar to existing tools (sketch-to-render, 3d-to-render)
   - System prompt-based generation
   - Settings toggles (no user prompt)
   - Image-to-render workflow

## SketchUp Plugin Architecture

### File Structure

```
renderiq-sketchup-plugin/
├── renderiq.rb                    # Main plugin file
├── renderiq/
│   ├── camera_manager.rb          # Camera position management
│   ├── screenshot_capture.rb      # Screenshot functionality
│   ├── api_client.rb              # Renderiq API integration
│   ├── settings_dialog.rb         # Settings UI
│   ├── render_dialog.rb           # Render results display
│   └── utils.rb                   # Utility functions
├── resources/
│   ├── icons/
│   │   ├── renderiq_16.png
│   │   ├── renderiq_24.png
│   │   └── renderiq_32.png
│   └── html/
│       └── settings.html          # HTML-based settings UI
└── README.md
```

### Key Components

#### 1. Main Plugin File (`renderiq.rb`)

```ruby
# Main entry point
# Registers menu items
# Initializes plugin
```

#### 2. Camera Manager (`camera_manager.rb`)

```ruby
# Save camera position
# Load camera position
# List saved positions
# Delete positions
# Store in SketchUp model or external file
```

#### 3. Screenshot Capture (`screenshot_capture.rb`)

```ruby
# Capture current view
# Export at different resolutions
# Handle transparent backgrounds
# Save to temp directory
```

#### 4. API Client (`api_client.rb`)

```ruby
# Send image to Renderiq API
# Handle authentication (API key)
# Poll for render completion
# Download rendered result
```

#### 5. Settings Dialog (`settings_dialog.rb`)

```ruby
# Quality selector (standard/high/ultra)
# Aspect ratio selector
# Style selector
# Model selector
# API key configuration
```

#### 6. Render Dialog (`render_dialog.rb`)

```ruby
# Display render progress
# Show rendered result
# Download button
# Save to SketchUp model
```

## API Integration

### Endpoint
- **POST** `/api/renders`
- Similar to existing `/apps` tools

### Request Format
```json
{
  "prompt": "<system_prompt>",  // Generated from settings
  "uploadedImageData": "<base64>",
  "uploadedImageType": "image/png",
  "projectId": "<project_id>",
  "imageType": "sketchup-to-render",
  "type": "image",
  "quality": "high",
  "aspectRatio": "16:9",
  "style": "photorealistic",
  "model": "imagen-3.0-generate-001"
}
```

### System Prompt Template
```
You are an expert architectural visualizer specializing in transforming 3D model screenshots into photorealistic architectural renders.

Transform this SketchUp 3D model screenshot into a photorealistic architectural render with:
- Realistic materials and textures
- Natural lighting and shadows
- Professional architectural presentation quality
- Accurate perspective and proportions
- Enhanced environmental context
- Photorealistic detail and depth

Maintain the architectural design integrity while enhancing realism and visual appeal.
```

## Settings Configuration

### Quality Options
- Standard (1080p / 1K) - 5 credits
- High (2160p / 2K) - 10 credits
- Ultra (4320p / 4K) - 15 credits

### Aspect Ratio Options
- 16:9 (Widescreen)
- 4:3 (Traditional)
- 1:1 (Square)
- 9:16 (Portrait)

### Style Options
- Photorealistic (default)
- Dramatic lighting
- Soft lighting
- Studio lighting
- Natural daylight

### Model Options
- Imagen 3.0 Standard
- Imagen 3.0 Fast
- Gemini 2.0 Flash
- (Based on available models)

## User Workflow

1. **Setup**
   - Install plugin
   - Configure API key (stored securely)
   - Set default settings

2. **Capture & Render**
   - Position camera in SketchUp
   - (Optional) Save camera position
   - Click "Capture & Render" button
   - Plugin captures screenshot
   - Settings dialog opens
   - User adjusts settings (optional)
   - Click "Generate Render"
   - Plugin sends to Renderiq API
   - Progress dialog shows status
   - Rendered result displayed
   - User can download or save to model

3. **Camera Management**
   - Save current camera position
   - Load saved position
   - List all saved positions
   - Delete positions

## Extension Warehouse Requirements

### Submission Checklist
- [ ] Plugin works on Windows and Mac
- [ ] Tested on SketchUp 2020, 2021, 2022, 2023, 2024
- [ ] No external dependencies (or clearly documented)
- [ ] Proper error handling
- [ ] User-friendly UI
- [ ] Clear documentation
- [ ] Privacy policy (API key handling)
- [ ] Terms of service
- [ ] Support contact information

### Required Files
1. **RBZ file** (ZIP archive)
   - Main `.rb` file
   - Support folder with same name
   - Resources folder
   - README.txt

2. **Extension Info**
   - Name: "Renderiq AI Renderer"
   - Description: "Transform your SketchUp models into photorealistic renders using AI"
   - Version: 1.0.0
   - Author: Renderiq
   - Website: https://renderiq.io
   - Support: support@renderiq.io

3. **Screenshots**
   - Plugin UI
   - Before/after comparison
   - Settings dialog
   - Render results

4. **Documentation**
   - User guide
   - Installation instructions
   - Troubleshooting
   - API key setup

## Development Steps

### Phase 1: Basic Structure
1. Create plugin file structure
2. Register menu items
3. Create basic dialogs
4. Implement camera management

### Phase 2: Screenshot & API
1. Implement screenshot capture
2. Create API client
3. Test API integration
4. Handle authentication

### Phase 3: UI & Settings
1. Create settings dialog
2. Implement system prompt generation
3. Add progress tracking
4. Create render display dialog

### Phase 4: Polish & Testing
1. Error handling
2. User feedback
3. Cross-platform testing
4. Documentation

### Phase 5: Submission
1. Package as RBZ
2. Prepare Extension Warehouse materials
3. Submit for review
4. Address feedback

## Technical Considerations

### Ruby Version
- SketchUp uses Ruby 2.7+ (varies by version)
- Use compatible Ruby syntax

### API Key Storage
- Store in SketchUp model attributes (encrypted)
- Or use Windows Registry / macOS Keychain
- Never hardcode in plugin

### Error Handling
- Network errors
- API errors
- Invalid API key
- Missing project ID
- File I/O errors

### Performance
- Async API calls (use threads)
- Progress indicators
- Timeout handling
- Cancel operations

## Next Steps

1. Create initial plugin structure
2. Implement camera management
3. Add screenshot capture
4. Integrate with Renderiq API
5. Create UI dialogs
6. Test and refine
7. Package for Extension Warehouse







