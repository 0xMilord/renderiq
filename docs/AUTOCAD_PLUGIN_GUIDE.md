# Renderiq AutoCAD Plugin - Integration Guide

## Overview

The Renderiq AutoCAD Plugin brings AI-powered rendering to AutoCAD, enabling architects and drafters to create photorealistic visualizations directly from their CAD drawings and 3D models.

---

## Integration Architecture

### 1. AutoCAD API Integration

**Technology Stack:**
- **Language**: C# (.NET Framework 4.8+ / .NET 6+)
- **API**: AutoCAD .NET API (ObjectARX .NET)
- **UI Framework**: WPF for dialogs, AutoCAD Ribbon API
- **SDK Requirements**: AutoCAD ObjectARX SDK

**Plugin Structure:**
```
RenderiqAutoCADPlugin/
├── RenderiqAutoCADPlugin.dll    # Main plugin assembly
├── RenderiqAutoCADPlugin.bundle # Bundle manifest (AutoCAD 2013+)
├── RenderiqAPI.dll              # Renderiq SDK wrapper
├── Icons/
│   ├── Renderiq16.bmp           # Small icons
│   ├── Renderiq32.bmp           # Large icons
│   └── RenderiqLarge.bmp        # Extra large icons
└── Resources/
    └── Strings.resx             # Localized strings
```

### 2. Bundle Manifest

**For AutoCAD 2013+ (Recommended):**
```json
{
  "Name": "Renderiq",
  "Version": "1.0.0",
  "Description": "AI-powered photorealistic rendering",
  "Author": "Renderiq",
  "Assembly": "RenderiqAutoCADPlugin.dll",
  "Components": [
    {
      "Type": "Command",
      "Name": "RENDERIQ",
      "ClassName": "RenderiqAutoCADPlugin.RenderiqCommand"
    },
    {
      "Type": "Command",
      "Name": "RENDERIQSETTINGS",
      "ClassName": "RenderiqAutoCADPlugin.SettingsCommand"
    },
    {
      "Type": "Command",
      "Name": "RENDERIQCREDITS",
      "ClassName": "RenderiqAutoCADPlugin.CreditsCommand"
    }
  ]
}
```

**Legacy .NET Add-In (AutoCAD 2012 and earlier):**
- Use `acad.lsp` or `acad.rx` for auto-loading
- Register commands in `Initialize()` method

---

## UI Integration Strategy

### 1. Ribbon Panel (Primary Access)

**Location**: `Add-Ins` tab → `Renderiq` panel

**Panel Layout:**
```
┌─────────────────────────────────────────┐
│ Renderiq Panel                         │
├─────────────────────────────────────────┤
│  [🎨 Render]  [📊 Credits]             │
│  [⚙️ Settings]  [📁 Projects]          │
│  [📋 Queue]                             │
└─────────────────────────────────────────┘
```

**Button Configuration:**
- **Large Buttons**: Primary actions (Render, Credits)
- **Small Buttons**: Secondary actions (Settings, Projects)
- **Split Buttons**: Render button with style dropdown
- **Flyouts**: Queue button with recent renders

**Keyboard Shortcuts:**
- `RENDERIQ` command (alias: `RIR`)
- `RENDERIQSETTINGS` command (alias: `RIS`)
- `RENDERIQCREDITS` command (alias: `RIC`)

### 2. Toolbar (Classic UI)

**For Users with Classic Interface:**
```
┌─────────────────────┐
│  🎨 Render          │
│  📊 Credits         │
│  ⚙️ Settings        │
│  📁 Projects        │
│  📋 Queue           │
└─────────────────────┘
```

**Auto-Load**: Toolbar appears automatically when plugin loads

### 3. Context Menu Integration

**Right-Click on Model Space:**
```
┌────────────────────────────┐
│ Zoom                       │
│ Pan                        │
├────────────────────────────┤
│ 🎨 Render with Renderiq    │ ← Custom
│ 📋 Copy Render Settings    │ ← Custom
└────────────────────────────┘
```

**Right-Click on Viewport (Layout):**
- Same context menu options
- Detects viewport type automatically

### 4. Status Bar Integration

**Persistent Status Bar Button:**
```
┌──────────────────────────────────────────────────────┐
│ AutoCAD Status Bar                                   │
│ [Model] [Renderiq: ✅ | Credits: 150] [Grid] [Ortho]│
└──────────────────────────────────────────────────────┘
```

**Status Bar Features:**
- **Click**: Opens quick render dialog
- **Right-Click**: Shows credits menu
- **Hover**: Tooltip with connection status
- **Color Coding**: Green (connected), Yellow (warning), Red (error)

### 5. Command Line Integration

**Command Prompt Feedback:**
```
Command: RENDERIQ
Select view or press Enter for current view:
Select objects or press Enter for all:
Quality [Standard/High/Ultra] <High>:
Style [Photorealistic/Dramatic/Soft] <Photorealistic>:
Rendering... (10 credits)
Render ID: abc123-def456
Status: Processing... (check with RENDERIQSTATUS)
```

---

## Core Features

### 1. View Selection & Rendering

**Supported Views:**
- ✅ **Model Space Views**: 3D and 2D views
- ✅ **Layout Viewports**: Paper space viewports
- ✅ **Named Views**: Saved views (VIEW command)
- ✅ **Camera Views**: Camera objects
- ✅ **Section Views**: Section planes

**View Extraction:**
- Captures current viewport
- Extracts camera/view settings
- Converts to image (PNG/JPEG)
- Preserves aspect ratio
- Maintains drawing scale

### 2. Object Selection

**Selective Rendering:**
- Select specific objects to render
- Filter by layer
- Filter by object type
- Include/exclude blocks
- Background options (transparent/white/color)

**Workflow:**
```
Command: RENDERIQ
Select objects or [All/CurrentView] <All>: _all_
Select style [Photorealistic/Dramatic/Soft] <Photorealistic>:
Quality [Standard/High/Ultra] <High>: _high_
Processing... Rendering selected objects.
```

### 3. Drawing Export Modes

**Export Modes:**

**1. Current View:**
- Renders what's visible in viewport
- Preserves zoom/pan settings
- Maintains view angle

**2. Selected Objects:**
- Renders only selected entities
- Isolated view
- Background customization

**3. Named View:**
- Restores saved view
- Renders that view
- Batch render multiple views

**4. Layout Viewport:**
- Renders paper space viewport
- Includes title blocks
- PDF-ready output

### 4. Render Queue Management

**Queue Dialog:**
```
┌──────────────────────────────────────────┐
│ Renderiq Queue                           │
├──────────────────────────────────────────┤
│ Active Renders:                          │
│ ⏳ Elevation A         60% ████████░░    │
│    ETA: 15s            [Cancel]          │
│                                          │
│ Pending:                                 │
│ ⏸ Floor Plan 1        Queued            │
│ ⏸ Section B           Queued            │
│                                          │
│ Completed (Last 24h):                    │
│ ✓ Perspective View    [View] [Download]  │
│ ✓ Elevation C         [View] [Download]  │
│                                          │
│ [Clear Completed] [Export All]           │
└──────────────────────────────────────────┘
```

**Queue Features:**
- Background processing
- Progress tracking
- Cancel capability
- Result gallery
- Batch operations

### 5. Drawing Context Integration

**Auto-Detection:**
- Detects architectural drawings
- Identifies elevation markers
- Recognizes floor plan layouts
- Suggests appropriate styles

**Style Recommendations:**
- **Floor Plans**: Clean line drawings
- **Elevations**: Architectural elevations
- **3D Models**: Photorealistic
- **Details**: High-detail renders

### 6. Settings & Configuration

**Settings Dialog:**

**Tab 1: Authentication**
- Sign in/out
- API key management
- Token status
- Auto-login

**Tab 2: Render Defaults**
- Quality preset
- Style preset
- Aspect ratio
- Export resolution
- Background color

**Tab 3: AutoCAD Integration**
- Default export method
- Layer filtering
- Block handling
- Text visibility
- Dimension visibility

**Tab 4: Advanced**
- Upload compression
- Network settings
- Cache management
- Logging

---

## Accessibility & Visibility

### Always-Visible Elements

**1. Ribbon Panel**
- **Location**: Add-Ins tab (standard location)
- **Persistence**: Always visible when tab active
- **Icon Size**: Large (32x32) for visibility
- **Branding**: Distinctive Renderiq colors

**2. Status Bar Button**
- **Location**: Right side of status bar
- **Always Visible**: Yes
- **Interactive**: Click for quick actions
- **Information**: Credits + connection status

**3. Command Aliases**
- `RIR` - Quick render
- `RIS` - Settings
- `RIC` - Credits
- `RIQ` - Queue

**4. Keyboard Shortcuts (Custom)**
- `Ctrl+Shift+R`: Render current view
- `Ctrl+Shift+S`: Render settings
- `Ctrl+Shift+C`: Credits dialog

### Contextual Visibility

**5. Tool Palette**
- **When**: Tool palettes visible
- **Location**: Custom Renderiq palette
- **Content**: Quick access buttons
- **Dockable**: Yes, user-configurable

**6. Quick Access Toolbar (QAT)**
- **Optional**: Add Render button to QAT
- **Persistent**: Always visible at top
- **One-Click**: Fastest access method

---

## UI/UX Best Practices

### 1. Render Dialog

**Main Render Dialog:**
```
┌──────────────────────────────────────────┐
│ Render with Renderiq             [×]     │
├──────────────────────────────────────────┤
│                                          │
│  Preview:                                │
│  ┌──────────────────────────────┐       │
│  │                              │       │
│  │    [Drawing Preview]         │       │
│  │                              │       │
│  └──────────────────────────────┘       │
│                                          │
│  Render Settings:                       │
│  ┌────────────────────────────────┐     │
│  │ View: [Current View ▼]         │     │
│  │ Selection: [All Objects ▼]     │     │
│  │                                  │     │
│  │ Quality: [High ▼]               │     │
│  │ Style: [Photorealistic ▼]       │     │
│  │ Aspect: [16:9 ▼]                │     │
│  │                                  │     │
│  │ Credits: 10                     │     │
│  └────────────────────────────────┘     │
│                                          │
│  Advanced [▼]                            │
│  ┌────────────────────────────────┐     │
│  │ Resolution: [4096x2304 ▼]      │     │
│  │ Background: [White ▼]          │     │
│  │ Include Text: ☑               │     │
│  │ Include Dimensions: ☑         │     │
│  └────────────────────────────────┘     │
│                                          │
│  [Cancel]            [🎨 Render (10)]   │
└──────────────────────────────────────────┘
```

### 2. Progress Display

**Progress Dialog:**
```
┌──────────────────────────────────────────┐
│ Rendering...                      [×]     │
├──────────────────────────────────────────┤
│                                          │
│  ⏳ Processing your render               │
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

**Command Line Progress:**
```
Rendering... 10% ████░░░░░░
Rendering... 50% ██████████░░░░░░
Rendering... 80% ████████████████░░░░
Render complete! Opening result...
```

### 3. Result Display

**Result Dialog:**
```
┌──────────────────────────────────────────┐
│ Render Complete!                 [×]     │
├──────────────────────────────────────────┤
│                                          │
│  Original → Rendered                     │
│  ┌────────┐    ┌────────┐               │
│  │ CAD    │ → │ Render  │               │
│  └────────┘    └────────┘               │
│                                          │
│  [Download] [Compare] [Render Again]    │
│  [Insert into Drawing] [Share]          │
│                                          │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. AutoCAD .NET API Integration

**Command Registration:**
```csharp
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.Runtime;
using Autodesk.AutoCAD.EditorInput;

[CommandMethod("RENDERIQ")]
public void RenderCommand()
{
    Document doc = Application.DocumentManager.MdiActiveDocument;
    Editor ed = doc.Editor;
    
    // Get current view
    // Export to image
    // Send to Renderiq API
    // Display result
}
```

**View Export:**
```csharp
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.Geometry;

public byte[] ExportCurrentView()
{
    Document doc = Application.DocumentManager.MdiActiveDocument;
    Database db = doc.Database;
    
    // Get current viewport
    using (Transaction tr = db.TransactionManager.StartTransaction())
    {
        ViewportTableRecord vpr = ...;
        
        // Render viewport to image
        // Convert to bytes
        // Return image data
    }
}
```

### 2. Ribbon Panel Creation

```csharp
using Autodesk.Windows;

public void CreateRibbonPanel()
{
    RibbonControl ribbon = ComponentManager.Ribbon;
    RibbonTab tab = ribbon.FindTab("ACAD.AddIns");
    
    RibbonPanelSource panelSource = new RibbonPanelSource();
    panelSource.Title = "Renderiq";
    
    // Render button
    RibbonButton renderBtn = new RibbonButton();
    renderBtn.Text = "Render";
    renderBtn.LargeImage = LoadIcon("Renderiq32.bmp");
    renderBtn.CommandHandler = new RenderiqCommandHandler();
    
    panelSource.Items.Add(renderBtn);
    
    RibbonPanel panel = new RibbonPanel();
    panel.Source = panelSource;
    tab.Panels.Add(panel);
}
```

### 3. API Integration

**Using Renderiq SDK:**
```csharp
using RenderiqSDK;

public class RenderiqClient
{
    private string accessToken;
    
    public async Task<RenderResult> Render(
        byte[] imageData,
        RenderSettings settings)
    {
        var client = new RenderiqClient(accessToken);
        return await client.CreateRender(
            imageFile: imageData,
            quality: settings.Quality,
            style: settings.Style
        );
    }
}
```

---

## Deployment

### 1. Installation

**Bundle Installation (Recommended):**
```
%APPDATA%\Autodesk\ApplicationPlugins\
  └── Renderiq.bundle\
      ├── PackageContents.xml
      ├── RenderiqAutoCADPlugin.dll
      └── Icons\
```

**Legacy Installation:**
```
%APPDATA%\Autodesk\AutoCAD 2024\R24.0\enu\Support\
  └── RenderiqAutoCADPlugin.dll

%APPDATA%\Autodesk\AutoCAD 2024\R24.0\enu\Support\
  └── Renderiq.lsp  (auto-load script)
```

### 2. Auto-Loading

**Bundle Auto-Load:**
- Automatic on AutoCAD startup
- No user configuration needed

**Legacy Auto-Load (acad.lsp):**
```lisp
(defun s::startup ()
  (command "NETLOAD" "RenderiqAutoCADPlugin.dll")
)
```

### 3. Enterprise Deployment

**MSI Installer:**
- Silent install option
- Multi-version support
- Centralized configuration
- License key distribution

**Deployment Tools:**
- Group Policy (GPO)
- Microsoft Intune
- SCCM
- Manual distribution

---

## Performance Optimization

### 1. View Export

- **Async Export**: Non-blocking operations
- **Resolution Scaling**: Adjust based on quality
- **Compression**: JPEG compression for uploads
- **Caching**: Cache exported views

### 2. Large Drawings

- **Partial Export**: Export only visible objects
- **LOD (Level of Detail)**: Simplify complex blocks
- **Layer Filtering**: Hide unnecessary layers
- **Block Proxy**: Use proxy objects for complex blocks

### 3. Network Handling

- **Resumable Uploads**: For large exports
- **Background Processing**: Don't block AutoCAD
- **Offline Queue**: Queue when offline
- **Retry Logic**: Auto-retry on failure

---

## Security

### 1. Credential Management

- **Windows Credential Manager**: Secure token storage
- **Encrypted Configuration**: Encrypt API keys
- **Token Refresh**: Automatic refresh
- **No Hardcoding**: All secrets from secure storage

### 2. API Security

- **HTTPS Only**: All communications encrypted
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
- Portuguese (Brazil)

**Implementation:**
- Resource files (.resx) per language
- Command names remain English
- UI strings localized
- Date/number formatting per locale

---

## Testing Strategy

### 1. Unit Tests

- API client tests
- View export tests
- Command parsing tests
- Settings persistence

### 2. Integration Tests

- Full render workflow
- Multi-version AutoCAD
- Different drawing types
- Error scenarios

### 3. Performance Tests

- Large drawing handling
- Memory usage
- Export speed
- Network performance

---

## Resources

- **AutoCAD .NET API**: https://help.autodesk.com/view/OARX/2024/ENU/
- **ObjectARX SDK**: Included with AutoCAD
- **Renderiq API**: https://docs.renderiq.io/plugins
- **Python SDK**: https://github.com/renderiq/renderiq-plugin-sdk-python

---

## Success Metrics

- Plugin installations
- Active users
- Renders per user
- Feature adoption
- Performance benchmarks
- Error rates

