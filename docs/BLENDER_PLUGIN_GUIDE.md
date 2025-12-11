# Renderiq Blender Add-On - Integration Guide

## Overview

The Renderiq Blender Add-On brings AI-powered photorealistic rendering to Blender, enabling 3D artists and designers to generate stunning visualizations with a single click, directly from the Blender viewport.

---

## Integration Architecture

### 1. Blender Add-On Structure

**Technology Stack:**
- **Language**: Python 3.x
- **API**: Blender Python API (bpy)
- **UI Framework**: Blender's native UI system
- **Requirements**: Blender 3.0+ (Python 3.10+)

**Add-On Structure:**
```
renderiq_blender/
├── __init__.py              # Main add-on file
├── renderiq_operator.py     # Render operators
├── renderiq_panel.py        # UI panels
├── renderiq_preferences.py  # Settings
├── renderiq_api.py          # API client (using Python SDK)
├── icons/
│   └── renderiq_icon.png    # Add-on icon
└── README.md
```

### 2. Add-On Registration

**__init__.py Structure:**
```python
bl_info = {
    "name": "Renderiq AI Render",
    "author": "Renderiq",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Renderiq",
    "description": "AI-powered photorealistic rendering",
    "category": "Render",
}

import bpy
from . import renderiq_panel
from . import renderiq_operator
from . import renderiq_preferences

def register():
    renderiq_preferences.register()
    renderiq_operator.register()
    renderiq_panel.register()

def unregister():
    renderiq_panel.unregister()
    renderiq_operator.unregister()
    renderiq_preferences.unregister()
```

---

## UI Integration Strategy

### 1. Sidebar Panel (Primary Access)

**Location**: `View3D` sidebar → `Renderiq` tab (N-panel)

**Why This Placement:**
- **Always Accessible**: N-panel is core to Blender workflow
- **Non-Intrusive**: Doesn't clutter main UI
- **Context-Aware**: Visible in 3D viewport where rendering happens
- **User Familiar**: Blender users expect add-ons here

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ Renderiq                            │
├─────────────────────────────────────┤
│                                     │
│ Status: ✅ Connected                │
│ Credits: 150                        │
│                                     │
│ Quick Render:                       │
│ ┌───────────────────────────────┐  │
│ │ Quality: [High ▼]             │  │
│ │ Style: [Photorealistic ▼]     │  │
│ │ Aspect: [16:9 ▼]              │  │
│ │                               │  │
│ │ [🎨 Render Viewport]          │  │
│ └───────────────────────────────┘  │
│                                     │
│ Camera Selection:                   │
│ ☑ Use Active Camera                │
│ ☑ Use Current View                 │
│                                     │
│ Render Queue:                       │
│ ⏳ Scene Render     60%             │
│ ✓ Camera 01        [View]          │
│                                     │
│ [Open Settings]                     │
└─────────────────────────────────────┘
```

**Panel Features:**
- **Collapsible Sections**: User can expand/collapse
- **Compact Mode**: Minimal UI for small screens
- **Tooltips**: Helpful descriptions on all controls
- **Live Updates**: Credit balance auto-refreshes

### 2. Viewport Header Integration

**Render Menu Addition:**
```
Viewport Header:
┌────────────────────────────────────────┐
│ View │ Select │ Add │ ... │ Render │  │
│                                      │
│ Render Menu:                          │
│ • Render Image                        │
│ • Render Animation                    │
│ • 🎨 Renderiq AI Render     ← New     │
│ • Renderiq Settings        ← New     │
│ • Renderiq Queue           ← New     │
└────────────────────────────────────────┘
```

### 3. Properties Panel Integration

**Render Properties Tab:**
```
┌─────────────────────────────────────┐
│ Render Properties                   │
├─────────────────────────────────────┤
│ Render Engine: [Eevee ▼]            │
│ ... (standard options)              │
├─────────────────────────────────────┤
│ Renderiq AI Render                  │ ← New section
│ ┌───────────────────────────────┐  │
│ │ Enable Renderiq: ☑            │  │
│ │ Quality: [High ▼]             │  │
│ │ Style: [Photorealistic ▼]     │  │
│ │ [Render with Renderiq]        │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 4. Topbar Menu Integration

**Topbar Menu Addition:**
```
Topbar:
Render → Renderiq → 
  • Render Current View
  • Render Active Camera
  • Render All Cameras
  • Open Queue
  • Settings
  • Check Credits
```

### 5. Context Menu Integration

**Right-Click in 3D Viewport:**
```
┌────────────────────────────┐
│ View Selected              │
│ Frame Selected             │
├────────────────────────────┤
│ 🎨 Render with Renderiq    │ ← Custom
│ 📋 Copy Render Settings    │ ← Custom
└────────────────────────────┘
```

**Right-Click on Camera Object:**
```
┌────────────────────────────┐
│ Select Camera              │
│ Set Active Camera          │
├────────────────────────────┤
│ 🎨 Render This Camera      │ ← Custom
└────────────────────────────┘
```

---

## Core Features

### 1. Viewport Rendering

**Render Modes:**

**1. Current Viewport:**
- Renders exactly what's visible
- Preserves view angle
- Maintains composition
- Fast preview option

**2. Active Camera:**
- Uses scene's active camera
- Respects camera settings
- Maintains aspect ratio
- Professional output

**3. All Cameras:**
- Batch render all cameras
- Queue management
- Background processing
- Result gallery

### 2. Scene Export

**Export Options:**
- **Viewport Screenshot**: Fast, what you see
- **Viewport Render**: Higher quality, uses viewport renderer
- **Material Preview**: Preview materials
- **Solid Mode**: Clean line drawings

**Export Settings:**
- Resolution (viewport or custom)
- Aspect ratio (auto or custom)
- Include overlays (grid, gizmos, etc.)
- Background (transparent/HDRI/solid)

### 3. Render Queue

**Queue Panel:**
```
┌─────────────────────────────────────┐
│ Renderiq Queue                      │
├─────────────────────────────────────┤
│ Active:                             │
│ ⏳ Camera 01        60% ████████░░  │
│    ETA: 12s         [Cancel]        │
│                                     │
│ Queued:                             │
│ ⏸ Camera 02        Waiting         │
│ ⏸ Viewport Render  Waiting         │
│                                     │
│ Completed:                          │
│ ✓ Camera 01        [View] [Save]   │
│ ✓ Viewport         [View] [Save]   │
│                                     │
│ [Clear Completed] [Export All]      │
└─────────────────────────────────────┘
```

**Queue Features:**
- Background processing
- Progress tracking
- Cancel capability
- Result previews
- Save to file
- Add to Blender as image

### 4. Material & Lighting Integration

**Style Presets with Material Hints:**
- **Photorealistic**: Enhances PBR materials
- **Architectural**: Optimizes for architecture
- **Product**: Product photography style
- **Interior**: Interior design optimization
- **Exterior**: Exterior architectural style

**Lighting Detection:**
- Analyzes scene lighting
- Suggests appropriate styles
- Adjusts render parameters
- Optimizes for light type

### 5. Animation Support

**Frame Rendering:**
- Render keyframes
- Render animation sequence
- Batch processing
- Timeline integration

**Workflow:**
1. Set animation range
2. Select keyframes or all frames
3. Queue renders
4. Process in background
5. Export sequence

### 6. Settings & Preferences

**Preferences Dialog:**

**Tab 1: Account**
- Sign in/out
- API key management
- Token status
- Auto-login

**Tab 2: Render Settings**
- Default quality
- Default style
- Default aspect ratio
- Export resolution
- Background options

**Tab 3: Blender Integration**
- Viewport capture method
- Camera selection default
- Overlay handling
- Material export mode

**Tab 4: Advanced**
- Upload compression
- Network settings
- Cache location
- Logging level
- Debug mode

---

## Accessibility & Visibility

### Always-Visible Elements

**1. Sidebar Panel (N-Panel)**
- **Location**: Right sidebar (N-key)
- **Tab Name**: "Renderiq" (with icon)
- **Visibility**: Always available in 3D viewport
- **Persistent**: Stays open across sessions

**2. Topbar Menu**
- **Location**: Top menu bar
- **Menu**: Render → Renderiq
- **Always Visible**: Yes, in topbar
- **Keyboard**: Alt+R → R (quick access)

**3. Properties Panel Section**
- **Location**: Render Properties tab
- **Section**: "Renderiq AI Render"
- **Visibility**: Always visible when tab open
- **Expandable**: User can collapse

### Contextual Visibility

**4. Viewport Header Menu**
- **When**: In 3D viewport
- **Location**: Header menu → Render
- **Action**: Quick render options

**5. Context Menu**
- **When**: Right-click in viewport
- **Location**: Context menu
- **Action**: Render current view

**6. Toolbar (Optional)**
- **When**: Toolbar visible (T-key)
- **Location**: Custom Renderiq tools
- **Action**: Quick access buttons

---

## UI/UX Best Practices

### 1. Panel Design

**Main Panel Layout:**
```python
class RENDERIQ_PT_main_panel(bpy.types.Panel):
    bl_label = "Renderiq"
    bl_idname = "RENDERIQ_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Renderiq"
    
    def draw(self, context):
        layout = self.layout
        prefs = context.preferences.addons[__name__].preferences
        
        # Status
        box = layout.box()
        box.label(text="Status:", icon='CHECKMARK')
        box.label(text=f"Credits: {prefs.credit_balance}")
        
        # Quick Render
        box = layout.box()
        box.label(text="Quick Render:")
        box.prop(prefs, "quality_preset")
        box.prop(prefs, "style_preset")
        box.operator("renderiq.render_viewport", 
                     text="🎨 Render Viewport", 
                     icon='RENDER_STILL')
```

### 2. Progress Display

**Progress in Panel:**
```
┌─────────────────────────────────────┐
│ Rendering...                        │
│ ████████████████░░░░  80%          │
│ ETA: 8 seconds                      │
│ [Cancel]                            │
└─────────────────────────────────────┘
```

**Status Bar (Bottom):**
```
Blender Status Bar:
Rendering: Camera 01 (80%) | ETA: 8s | [Cancel]
```

### 3. Result Display

**Image Editor Integration:**
- Opens result in Image Editor
- Side-by-side comparison
- Save to file
- Add to Blender as texture

**Result Panel:**
```
┌─────────────────────────────────────┐
│ Render Complete!                    │
├─────────────────────────────────────┤
│                                     │
│ [Result Preview Image]              │
│                                     │
│ [Open in Image Editor]              │
│ [Save to File]                      │
│ [Add as Texture]                    │
│ [Render Again]                      │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Viewport Capture

```python
import bpy
import bgl
import gpu
from gpu_extras.presets import draw_texture_2d

def capture_viewport():
    """Capture current viewport as image"""
    region = bpy.context.region
    width = region.width
    height = region.height
    
    # Off-screen rendering
    offscreen = gpu.types.GPUOffScreen(width, height)
    
    # Render viewport
    with offscreen.bind():
        bpy.ops.render.opengl(view_context=True)
        buffer = bgl.Buffer(bgl.GL_BYTE, width * height * 4)
        bgl.glReadPixels(0, 0, width, height, 
                        bgl.GL_RGBA, bgl.GL_UNSIGNED_BYTE, buffer)
    
    # Convert to image
    image = bpy.data.images.new("Renderiq Export", width, height)
    image.pixels = [v / 255.0 for v in buffer]
    
    return image
```

### 2. API Integration

```python
from renderiq_plugin_sdk import RenderiqClient

class RenderiqAPI:
    def __init__(self):
        prefs = bpy.context.preferences.addons[__name__].preferences
        self.client = RenderiqClient(
            access_token=prefs.access_token,
            platform="blender",
            plugin_version=bl_info["version"]
        )
    
    def render_image(self, image, settings):
        """Send image to Renderiq API"""
        # Save image to temporary file
        temp_path = bpy.app.tempdir + "renderiq_export.png"
        image.save_render(temp_path)
        
        # Read as bytes
        with open(temp_path, 'rb') as f:
            image_data = f.read()
        
        # Create render
        result = self.client.create_render(
            image_file=image_data,
            quality=settings.quality,
            style=settings.style,
            use_resumable=True  # For large images
        )
        
        return result
```

### 3. Operator Implementation

```python
import bpy

class RENDERIQ_OT_render_viewport(bpy.types.Operator):
    bl_idname = "renderiq.render_viewport"
    bl_label = "Render Viewport"
    bl_description = "Render current viewport with Renderiq"
    bl_options = {'REGISTER', 'UNDO'}
    
    def execute(self, context):
        # Capture viewport
        image = capture_viewport()
        
        # Get settings
        prefs = context.preferences.addons[__name__].preferences
        
        # Render
        api = RenderiqAPI()
        result = api.render_image(image, prefs)
        
        # Show progress
        # Poll for completion
        # Display result
        
        return {'FINISHED'}
    
    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)
```

### 4. Background Processing

```python
import threading

class RenderQueue:
    def __init__(self):
        self.queue = []
        self.processing = False
    
    def add_render(self, image, settings):
        """Add render to queue"""
        self.queue.append({
            'image': image,
            'settings': settings,
            'status': 'queued'
        })
        
        if not self.processing:
            self.process_queue()
    
    def process_queue(self):
        """Process queue in background"""
        self.processing = True
        
        def process():
            while self.queue:
                item = self.queue.pop(0)
                item['status'] = 'processing'
                
                # Render
                api = RenderiqAPI()
                result = api.render_image(item['image'], item['settings'])
                
                item['status'] = 'completed'
                item['result'] = result
            
            self.processing = False
        
        thread = threading.Thread(target=process)
        thread.start()
```

---

## Deployment

### 1. Add-On Packaging

**ZIP Structure:**
```
renderiq_blender.zip
├── __init__.py
├── renderiq_operator.py
├── renderiq_panel.py
├── renderiq_preferences.py
├── renderiq_api.py
├── icons/
│   └── renderiq_icon.png
└── README.md
```

### 2. Installation

**Manual Installation:**
1. Blender → Edit → Preferences → Add-ons
2. Click "Install..."
3. Select `renderiq_blender.zip`
4. Enable the add-on
5. Configure settings

**Auto-Installation Script:**
```python
# For enterprise deployment
import addon_utils
addon_utils.enable("renderiq_blender", default_set=True, persistent=True)
```

### 3. Distribution

**Blender Market:**
- Official Blender add-on marketplace
- Automatic updates
- User reviews
- Payment processing

**GitHub Releases:**
- Open-source distribution
- Version management
- Download tracking

**Enterprise Distribution:**
- Internal repository
- Custom installer
- License management

---

## Performance Optimization

### 1. Viewport Capture

- **Async Capture**: Non-blocking operations
- **Resolution Scaling**: Adjust based on quality
- **Compression**: PNG/JPEG compression
- **Caching**: Cache captured images

### 2. Large Scenes

- **LOD Export**: Simplify for preview
- **Material Baking**: Pre-bake materials
- **Texture Compression**: Compress textures
- **Geometry Reduction**: Simplify complex meshes

### 3. Network Handling

- **Resumable Uploads**: For large exports
- **Background Upload**: Don't block Blender
- **Queue Management**: Process in background
- **Retry Logic**: Auto-retry on failure

---

## Security

### 1. Credential Storage

- **Blender Preferences**: Encrypted storage in user preferences
- **Keychain (macOS)**: Use system keychain
- **Credential Manager (Windows)**: Use Windows Credential Manager
- **Token Refresh**: Automatic refresh

### 2. API Security

- **HTTPS Only**: All API calls encrypted
- **Certificate Validation**: Verify certificates
- **Rate Limiting**: Respect API limits
- **Request Signing**: Sign critical requests

---

## Localization

**Supported Languages:**
- English (default)
- Spanish
- French
- German
- Japanese
- Chinese (Simplified)

**Implementation:**
- Blender's translation system (bpy.app.translations)
- `.po` files for translations
- UI strings in translation context
- Tooltips translated

---

## Testing Strategy

### 1. Unit Tests

- API client tests
- Viewport capture tests
- Settings persistence
- Queue management

### 2. Integration Tests

- Full render workflow
- Multi-version Blender
- Different scene types
- Error scenarios

### 3. User Testing

- Artist workflows
- Large scene testing
- Performance benchmarking
- UI/UX validation

---

## Resources

- **Blender API Docs**: https://docs.blender.org/api/current/
- **Blender Python**: https://docs.blender.org/manual/en/latest/advanced/scripting/index.html
- **Renderiq API**: https://docs.renderiq.io/plugins
- **Python SDK**: https://github.com/renderiq/renderiq-plugin-sdk-python

---

## Success Metrics

- Add-on installations
- Active users
- Renders per user
- Feature adoption
- Performance benchmarks
- Error rates

