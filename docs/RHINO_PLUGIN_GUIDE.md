# Renderiq Rhino Plugin - Integration Guide

## Overview

The Renderiq Rhino Plugin brings AI-powered rendering to Rhino 3D and Grasshopper, enabling architects and designers to generate photorealistic visualizations directly from their Rhino models and parametric designs.

---

## Integration Architecture

### 1. Rhino Plugin Structure

**Technology Stack:**
- **Language**: C# (.NET Framework / .NET Core)
- **API**: RhinoCommon SDK
- **UI Framework**: Eto.Forms for cross-platform UI
- **Grasshopper**: Grasshopper SDK for visual scripting

**Plugin Structure:**
```
RenderiqRhinoPlugin/
├── RenderiqRhinoPlugin.rhp        # Main plugin
├── RenderiqRhinoPlugin.dll        # Plugin assembly
├── RenderiqGrasshopper.gha        # Grasshopper component
├── RenderiqAPI.dll                # Renderiq SDK wrapper
├── Icons/
│   ├── Renderiq16.png
│   ├── Renderiq24.png
│   └── Renderiq32.png
└── Resources/
    └── Strings.resx
```

### 2. Plugin Registration

**Rhino Plugin (.rhp):**
```csharp
public class RenderiqRhinoPlugin : Rhino.PlugIns.PlugIn
{
    public RenderiqRhinoPlugin()
    {
        Instance = this;
    }
    
    public static RenderiqRhinoPlugin Instance { get; private set; }
    
    public override string PlugInName => "Renderiq";
    public override string PlugInVersion => "1.0.0";
    
    protected override LoadReturnCode OnLoad(ref string errorMessage)
    {
        // Register commands
        // Create UI
        // Initialize SDK
        
        return LoadReturnCode.Success;
    }
}
```

---

## UI Integration Strategy

### 1. Toolbar Integration (Primary Access)

**Location**: Custom `Renderiq` toolbar

**Why This Placement:**
- **Rhino Standard**: Toolbars are primary UI in Rhino
- **Customizable**: Users can dock anywhere
- **Persistent**: Stays visible when docked
- **Icon-Based**: Visual, easy to recognize

**Toolbar Layout:**
```
┌─────────────────────────┐
│ Renderiq Toolbar        │
├─────────────────────────┤
│ [🎨 Render]             │
│ [📊 Credits]            │
│ [⚙️ Settings]           │
│ [📁 Projects]           │
│ [📋 Queue]              │
│ [🔧 Grasshopper]        │
└─────────────────────────┘
```

**Button Features:**
- **Large Icons**: 32x32px for visibility
- **Tooltips**: Detailed descriptions
- **Drop-Down Menus**: Style/quality presets
- **Status Indicators**: Connection status, credits

### 2. Command Integration

**Command Registration:**
```
Commands:
- Renderiq            (Alias: RIR)  - Main render command
- RenderiqSettings    (Alias: RIS)  - Settings dialog
- RenderiqCredits     (Alias: RIC)  - Credits dialog
- RenderiqQueue       (Alias: RIQ)  - Queue manager
- RenderiqGrasshopper (Alias: RIG)  - Grasshopper panel
```

**Command Line Interface:**
```
Command: Renderiq
Select view or press Enter for current view:
Quality [Standard/High/Ultra] <High>:
Style [Photorealistic/Dramatic/Soft] <Photorealistic>:
Rendering viewport...
Render ID: abc123-def456
Status: Processing... (use RenderiqQueue to check)
```

### 3. Viewport Context Menu

**Right-Click in Viewport:**
```
┌────────────────────────────┐
│ Zoom                       │
│ Pan                        │
│ Rotate                     │
├────────────────────────────┤
│ 🎨 Render with Renderiq    │ ← Custom
│ 📋 Copy Render Settings    │ ← Custom
└────────────────────────────┘
```

**Right-Click on Named View:**
```
┌────────────────────────────┐
│ Set Current View           │
│ Delete View                │
├────────────────────────────┤
│ 🎨 Render This View        │ ← Custom
└────────────────────────────┘
```

### 4. Properties Panel Integration

**Document Properties → Renderiq:**
```
┌─────────────────────────────────────┐
│ Document Properties                 │
├─────────────────────────────────────┤
│ Units                               │
│ Grid                                │
│ ...                                 │
├─────────────────────────────────────┤
│ Renderiq                            │ ← New section
│ ┌───────────────────────────────┐  │
│ │ Enable Renderiq: ☑            │  │
│ │ Default Quality: [High ▼]     │  │
│ │ Default Style: [Photo ▼]      │  │
│ │ Auto-render on view change: ☐ │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 5. Grasshopper Integration

**Grasshopper Component:**
```
Grasshopper Canvas:
┌─────────────────────────┐
│ Renderiq Render         │
├─────────────────────────┤
│ Input:                  │
│ • Viewport (viewport)   │
│ • Quality (int)         │
│ • Style (string)        │
│                         │
│ Output:                 │
│ • RenderID (string)     │
│ • Status (string)       │
│ • ResultURL (string)    │
└─────────────────────────┘
```

**Grasshopper Panel:**
- Dedicated Renderiq panel
- Quick access buttons
- Queue visualization
- Result preview

---

## Core Features

### 1. Viewport Rendering

**Render Modes:**

**1. Current Viewport:**
- Renders active viewport
- Preserves view angle
- Maintains composition
- Fast preview

**2. Named Views:**
- Renders saved views
- Batch render multiple views
- Queue management
- Result gallery

**3. All Viewports:**
- Renders all viewports
- Batch processing
- Parallel rendering
- Progress tracking

### 2. View Export

**Export Options:**
- **Viewport Screenshot**: Fast capture
- **High-Resolution Render**: Uses Rhino renderer
- **Wireframe**: Clean line drawings
- **Shaded**: Shaded viewport

**Export Settings:**
- Resolution (custom or presets)
- Aspect ratio (viewport or custom)
- Background (solid/HDRI/transparent)
- Overlay options (grid, axes, etc.)

### 3. Grasshopper Integration

**Visual Scripting:**
- Drag-and-drop component
- Parametric rendering
- Batch processing
- Result streaming

**Workflow:**
1. Add Renderiq component to canvas
2. Connect viewport input
3. Set quality/style parameters
4. Trigger render
5. Get result URL

**Component Features:**
- **Inputs**: Viewport, Quality, Style, Prompt
- **Outputs**: RenderID, Status, ResultURL, Progress
- **Auto-Update**: Poll for completion
- **Result Display**: Preview in canvas

### 4. Render Queue

**Queue Manager Dialog:**
```
┌─────────────────────────────────────┐
│ Renderiq Queue                      │
├─────────────────────────────────────┤
│ Active Renders:                     │
│ ⏳ Perspective View  60% ████████░░ │
│    ETA: 15s          [Cancel]       │
│                                     │
│ Queued:                             │
│ ⏸ Top View         Waiting         │
│ ⏸ Front View       Waiting         │
│                                     │
│ Completed:                          │
│ ✓ Perspective View  [View] [Save]  │
│ ✓ Isometric View    [View] [Save]  │
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
- Import to Rhino

### 5. Parametric Rendering

**Grasshopper Workflow:**
```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│ Viewport │ -> │ Renderiq     │ -> │ Result URL  │
│          │    │ Render       │    │             │
└──────────┘    └──────────────┘    └─────────────┘
                       │
                       v
                ┌──────────────┐
                │ Queue Status │
                └──────────────┘
```

**Use Cases:**
- Design iteration
- Parameter studies
- Batch visualization
- Automated workflows

### 6. Settings & Configuration

**Settings Dialog:**

**Tab 1: Account**
- Sign in/out
- API key management
- Token status
- Auto-login

**Tab 2: Render Defaults**
- Default quality
- Default style
- Default aspect ratio
- Export resolution
- Background options

**Tab 3: Rhino Integration**
- Viewport capture method
- Named view handling
- Overlay options
- Material export

**Tab 4: Grasshopper**
- Component settings
- Auto-update frequency
- Result display options
- Batch processing limits

---

## Accessibility & Visibility

### Always-Visible Elements

**1. Toolbar**
- **Location**: Docked toolbar (user-configurable)
- **Persistence**: Remains visible when docked
- **Icon Size**: Large (32x32) for visibility
- **Branding**: Distinctive Renderiq colors

**2. Command Aliases**
- `RIR` - Quick render
- `RIS` - Settings
- `RIC` - Credits
- `RIQ` - Queue
- `RIG` - Grasshopper panel

**3. Status Bar (Optional)**
- **Location**: Bottom status bar
- **Content**: Connection status + credits
- **Interactive**: Click for quick actions

### Contextual Visibility

**4. Viewport Menu**
- **When**: Right-click in viewport
- **Location**: Context menu
- **Action**: Render options

**5. Named Views Panel**
- **When**: Named views panel open
- **Location**: Renderiq column
- **Action**: Quick render button per view

**6. Grasshopper Canvas**
- **When**: Grasshopper open
- **Location**: Component library
- **Action**: Drag-and-drop component

---

## UI/UX Best Practices

### 1. Render Dialog

**Main Render Dialog:**
```
┌──────────────────────────────────────────┐
│ Render with Renderiq             [×]     │
├──────────────────────────────────────────┤
│                                          │
│  View Selection:                         │
│  ☑ Current Viewport                      │
│  ☐ Named View: [Top View ▼]             │
│  ☐ All Viewports                         │
│                                          │
│  Preview:                                │
│  ┌──────────────────────────────┐       │
│  │                              │       │
│  │    [Viewport Preview]        │       │
│  │                              │       │
│  └──────────────────────────────┘       │
│                                          │
│  Render Settings:                       │
│  ┌────────────────────────────────┐     │
│  │ Quality: [High ▼]              │     │
│  │ Style: [Photorealistic ▼]      │     │
│  │ Aspect: [16:9 ▼]               │     │
│  │                                │     │
│  │ Credits: 10                    │     │
│  └────────────────────────────────┘     │
│                                          │
│  Advanced [▼]                            │
│  ┌────────────────────────────────┐     │
│  │ Resolution: [4096x2304 ▼]      │     │
│  │ Background: [HDRI ▼]           │     │
│  │ Include Grid: ☐                │     │
│  │ Include Axes: ☐                │     │
│  └────────────────────────────────┘     │
│                                          │
│  [Cancel]            [🎨 Render (10)]   │
└──────────────────────────────────────────┘
```

### 2. Grasshopper Component UI

**Component Interface:**
```
┌─────────────────────────────┐
│ Renderiq Render             │
│ 🎨                          │
├─────────────────────────────┤
│ V - Viewport                │
│ Q - Quality [High]          │
│ S - Style [Photo]           │
│ P - Prompt [optional]       │
├─────────────────────────────┤
│ R - RenderID                │
│ St - Status                 │
│ U - ResultURL               │
│ Pr - Progress               │
└─────────────────────────────┘
```

**Component Features:**
- **Icon**: Visual identifier
- **Tooltips**: Help on hover
- **Preview**: Result preview in component
- **Status**: Color-coded status (green=done, yellow=processing)

### 3. Progress Display

**Progress in Dialog:**
```
┌──────────────────────────────────────────┐
│ Rendering...                      [×]     │
├──────────────────────────────────────────┤
│                                          │
│  ⏳ Processing render                    │
│                                          │
│  ████████████████░░░░  80%              │
│                                          │
│  Estimated time: 8 seconds               │
│                                          │
│  Render ID: abc123-def456                │
│                                          │
│  [Cancel]                                │
└──────────────────────────────────────────┘
```

**Status in Grasshopper:**
- Component shows progress bar
- Status output updates live
- Result URL populates when done

---

## Technical Implementation

### 1. Viewport Capture

```csharp
using Rhino;
using Rhino.Display;
using System.Drawing;

public Bitmap CaptureViewport(RhinoView view)
{
    var viewport = view.ActiveViewport;
    var size = viewport.Size;
    
    // Create bitmap
    var bitmap = new Bitmap(size.Width, size.Height);
    
    // Render viewport
    using (var graphics = Graphics.FromImage(bitmap))
    {
        var channel = viewport.GetChannel(DisplayChannelDescription.DefaultShaded);
        channel.Update();
        
        // Capture to bitmap
        // ...
    }
    
    return bitmap;
}
```

### 2. Grasshopper Component

```csharp
using Grasshopper;
using Grasshopper.Kernel;

public class RenderiqRenderComponent : GH_Component
{
    public RenderiqRenderComponent()
      : base("Renderiq Render", "RIR",
            "Render viewport with Renderiq AI",
            "Renderiq", "Render")
    {
    }
    
    protected override void RegisterInputParams(GH_InputParamManager pManager)
    {
        pManager.AddGenericParameter("Viewport", "V", "Viewport to render", GH_ParamAccess.item);
        pManager.AddIntegerParameter("Quality", "Q", "Render quality", GH_ParamAccess.item, 1);
        pManager.AddTextParameter("Style", "S", "Render style", GH_ParamAccess.item, "photorealistic");
    }
    
    protected override void RegisterOutputParams(GH_OutputParamManager pManager)
    {
        pManager.AddTextParameter("RenderID", "R", "Render ID", GH_ParamAccess.item);
        pManager.AddTextParameter("Status", "St", "Render status", GH_ParamAccess.item);
        pManager.AddTextParameter("ResultURL", "U", "Result URL", GH_ParamAccess.item);
    }
    
    protected override void SolveInstance(IGH_DataAccess DA)
    {
        // Get inputs
        // Capture viewport
        // Send to Renderiq API
        // Output results
    }
}
```

### 3. API Integration

```csharp
using RenderiqSDK;

public class RenderiqClient
{
    private string accessToken;
    
    public async Task<RenderResult> Render(
        Bitmap image,
        RenderSettings settings)
    {
        var client = new RenderiqClient(accessToken);
        
        // Convert bitmap to bytes
        byte[] imageData = ImageToBytes(image);
        
        return await client.CreateRender(
            imageFile: imageData,
            quality: settings.Quality,
            style: settings.Style,
            platform: "rhino"
        );
    }
}
```

---

## Deployment

### 1. Plugin Installation

**Rhino Plugin (.rhp):**
```
%APPDATA%\McNeel\Rhinoceros\7.0\Plug-ins\
  └── RenderiqRhinoPlugin.rhp

%LOCALAPPDATA%\Programs\Rhinoceros 7\
  └── Plug-ins\
      └── RenderiqRhinoPlugin\
          └── RenderiqRhinoPlugin.dll
```

**Grasshopper Component (.gha):**
```
%APPDATA%\Grasshopper\Libraries\
  └── RenderiqGrasshopper.gha
```

### 2. Auto-Loading

**Rhino Options:**
- Tools → Options → Plug-ins
- Enable "Renderiq" plugin
- Set to load on startup

**Grasshopper:**
- Auto-loads with Grasshopper
- Appears in component library
- No configuration needed

### 3. Enterprise Deployment

**MSI Installer:**
- Silent install option
- Multi-version Rhino support
- Grasshopper component included
- Centralized configuration

---

## Performance Optimization

### 1. Viewport Capture

- **Async Capture**: Non-blocking
- **Resolution Scaling**: Adjust based on quality
- **Compression**: JPEG compression for uploads
- **Caching**: Cache captured views

### 2. Large Models

- **LOD Export**: Simplify for preview
- **Hidden Object Filtering**: Exclude hidden geometry
- **Texture Compression**: Compress textures
- **Geometry Reduction**: Simplify complex meshes

### 3. Grasshopper Performance

- **Lazy Evaluation**: Only render when needed
- **Batch Processing**: Process multiple renders
- **Result Caching**: Cache results
- **Progress Feedback**: Show progress in component

---

## Security

### 1. Credential Storage

- **Windows Credential Manager**: Secure token storage
- **Encrypted Configuration**: Encrypt API keys
- **Token Refresh**: Automatic refresh
- **No Hardcoding**: All secrets from secure storage

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
- Chinese (Simplified)
- Japanese

**Implementation:**
- Resource files (.resx) per language
- Command names remain English
- UI strings localized
- Grasshopper component names localized

---

## Testing Strategy

### 1. Unit Tests

- API client tests
- Viewport capture tests
- Grasshopper component tests
- Settings persistence

### 2. Integration Tests

- Full render workflow
- Multi-version Rhino
- Grasshopper workflows
- Error scenarios

### 3. Performance Tests

- Large model handling
- Memory usage
- Export speed
- Network performance

---

## Resources

- **RhinoCommon SDK**: https://developer.rhino3d.com/guides/rhinocommon/
- **Grasshopper SDK**: https://developer.rhino3d.com/guides/grasshopper/
- **Renderiq API**: https://docs.renderiq.io/plugins
- **Python SDK**: https://github.com/renderiq/renderiq-plugin-sdk-python

---

## Success Metrics

- Plugin installations
- Active users
- Renders per user
- Grasshopper usage
- Feature adoption
- Performance benchmarks

