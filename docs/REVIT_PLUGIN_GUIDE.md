# Renderiq Revit Plugin - Integration Guide

## Overview

The Renderiq Revit Plugin brings AI-powered photorealistic rendering directly into Autodesk Revit, enabling architects and designers to generate stunning visualizations without leaving their BIM workflow.

---

## Integration Architecture

### 1. Revit API Integration

**Technology Stack:**
- **Language**: C# (.NET Framework 4.8+)
- **API**: Revit API (latest version)
- **UI Framework**: WPF for dialogs, Ribbon API for toolbar
- **SDK Requirements**: Revit SDK with Add-In Manager

**Plugin Structure:**
```
RenderiqRevitPlugin/
├── RenderiqRevitPlugin.dll       # Main plugin assembly
├── RenderiqRevitPlugin.addin     # Add-in manifest
├── RenderiqAPI.dll               # Renderiq SDK wrapper
├── Assets/
│   ├── Icons/                    # Plugin icons (16x16, 32x32)
│   └── Images/                   # UI images
└── Resources/
    └── Localization/             # Multi-language support
```

### 2. Add-In Manifest Configuration

```xml
<?xml version="1.0" encoding="utf-8"?>
<RevitAddIns>
  <AddIn Type="Command">
    <Text>Renderiq AI Render</Text>
    <Description>AI-powered photorealistic rendering</Description>
    <Assembly>RenderiqRevitPlugin.dll</Assembly>
    <FullClassName>RenderiqRevitPlugin.RenderiqCommand</FullClassName>
    <ClientId>YOUR_CLIENT_ID</ClientId>
    <VendorId>RENDERIQ</VendorId>
    <VendorDescription>Renderiq - AI Rendering Platform</VendorDescription>
    <SupportedSoftwareVersion>2022.0</SupportedSoftwareVersion>
    <MinimalSupportedSoftwareVersion>2020.0</MinimalSupportedSoftwareVersion>
  </AddIn>
  
  <AddIn Type="Application">
    <Text>Renderiq</Text>
    <Assembly>RenderiqRevitPlugin.dll</Assembly>
    <FullClassName>RenderiqRevitPlugin.RenderiqApplication</FullClassName>
    <ClientId>YOUR_CLIENT_ID</ClientId>
    <VendorId>RENDERIQ</VendorId>
  </AddIn>
</RevitAddIns>
```

---

## UI Integration Strategy

### 1. Ribbon Panel (Primary Access)

**Location**: `Add-Ins` tab → `Renderiq` panel

**Why This Placement:**
- **Always Visible**: Add-Ins tab is standard in all Revit installations
- **Professional**: Standard location for third-party tools
- **Discoverable**: Users expect plugins here
- **No Customization Required**: Works on any ribbon layout

**Panel Layout:**

```
┌─────────────────────────────────────────┐
│  Renderiq Panel                         │
├─────────────────────────────────────────┤
│  [🎨 Render View]  [📊 Credits]        │
│  [⚙️ Settings]     [📁 Projects]       │
└─────────────────────────────────────────┘
```

**Button Specifications:**
- **Size**: Large (32x32px icons)
- **Text**: Visible under icon
- **Tooltips**: Detailed descriptions
- **Keyboard Shortcuts**: Ctrl+R (Render), Ctrl+Shift+R (Credits)

### 2. Context Menu Integration

**Right-Click on 3D Views:**
```
┌────────────────────────────┐
│ View Properties            │
│ Duplicate View             │
├────────────────────────────┤
│ 🎨 Render with Renderiq    │ ← Custom menu item
│ 📋 Copy Render Settings    │
└────────────────────────────┘
```

**Right-Click on Floor Plans/Elevations:**
- Same context menu options
- Automatically detects view type and adjusts rendering mode

### 3. Status Bar Integration

**Persistent Status Bar Widget:**
```
┌─────────────────────────────────────────────────────┐
│ Revit Status Bar                                    │
│ Ready | Renderiq: ✅ Connected | Credits: 150       │
└─────────────────────────────────────────────────────┘
```

**Features:**
- **Connection Status**: Green checkmark when authenticated
- **Credit Balance**: Always visible
- **Click to Open**: Opens credits dialog
- **Update Frequency**: Auto-refreshes every 5 minutes

### 4. Floating Dockable Panel (Advanced Users)

**Optional Floating Panel:**
- **Location**: Can be docked to any side
- **Size**: 300px wide, auto-height
- **Persistence**: Remembers position across sessions

**Panel Contents:**
```
┌──────────────────────────────┐
│ Renderiq Quick Render        │
├──────────────────────────────┤
│ Current View: 3D View 1      │
│                              │
│ Quality: [High ▼]            │
│ Style: [Photorealistic ▼]    │
│                              │
│ [🎨 Render Now]              │
│                              │
│ Recent Renders:              │
│ • Office View - 2m ago       │
│ • Elevation A - 15m ago      │
│                              │
│ [View All →]                 │
└──────────────────────────────┘
```

---

## Core Features

### 1. View Selection & Rendering

**Feature Set:**
- ✅ **3D Views**: Orthographic and Perspective
- ✅ **Floor Plans**: With/without dimensions
- ✅ **Elevations**: Building elevations
- ✅ **Sections**: Cross-sections
- ✅ **Detail Views**: Close-up details

**Workflow:**
1. User selects active view
2. Plugin extracts view settings (camera, scope box, visibility)
3. Generates screenshot/export
4. Sends to Renderiq API
5. Shows progress in dialog
6. Displays result with download option

### 2. Render Queue Management

**Queue Panel:**
```
┌─────────────────────────────────────┐
│ Render Queue                        │
├─────────────────────────────────────┤
│ ✓ Office View          Completed    │
│   └─ View result | Download         │
│                                      │
│ ⏳ Elevation A          Processing   │
│   └─ 60% complete...                │
│                                      │
│ ⏸ Conference Room    Queued         │
│   └─ Position: 2                    │
│                                      │
│ [Cancel Selected] [Clear Completed] │
└─────────────────────────────────────┘
```

**Features:**
- Multiple renders in parallel
- Progress tracking per render
- Cancel capability
- Result preview thumbnails
- Batch download

### 3. Project Organization

**Project Management:**
- Link renders to Revit projects
- Organize by building/floor
- Tag renders with custom labels
- Search and filter renders

### 4. Settings & Configuration

**Settings Dialog Tabs:**

**1. Authentication:**
- Email/password sign-in
- API key management
- Auto-login option
- Token refresh handling

**2. Default Render Settings:**
- Quality preset (Standard/High/Ultra)
- Style preset (Photorealistic/Dramatic/etc.)
- Aspect ratio default
- Model selection

**3. Export Settings:**
- Image resolution
- Image format (PNG/JPG)
- Include/exclude elements
- Background color

**4. Advanced:**
- Upload compression
- Webhook configuration
- Network timeout settings
- Logging level

### 5. Credit Management

**Credits Display:**
- **Toolbar Button**: Shows current balance
- **Badge**: Red indicator when < 20 credits
- **Dialog**: Detailed credit history
- **Auto-Purchase**: Direct link to billing

**Credit Alerts:**
- Toast notification at 10 credits remaining
- Warning dialog at 5 credits
- Block rendering at 0 credits (with purchase prompt)

---

## Accessibility & Visibility

### Always-Visible Elements

**1. Ribbon Panel (Primary)**
- **Location**: Add-Ins tab (always present)
- **Visibility**: Always visible when tab is active
- **Icon Size**: Large (32x32) for easy clicking
- **Color**: Distinctive blue/purple brand color

**2. Status Bar Widget**
- **Location**: Bottom status bar
- **Persistence**: Always visible
- **Interactive**: Click to open quick actions
- **Information**: Connection status + credits

**3. Keyboard Shortcuts**
- `Ctrl+R`: Quick render current view
- `Ctrl+Shift+R`: Open render queue
- `Ctrl+Alt+R`: Open settings
- `Ctrl+Shift+C`: Check credits

### Contextual Visibility

**4. View Tab Integration**
- **When**: User is in a 3D view
- **Location**: View tab → Renderiq panel
- **Action**: One-click render from view ribbon

**5. Properties Panel**
- **When**: View selected
- **Location**: Properties panel → Renderiq section
- **Action**: Quick render settings inline

---

## UI/UX Best Practices

### 1. Dialog Design

**Render Dialog Layout:**
```
┌──────────────────────────────────────────┐
│ Render View: Office 3D View      [×]     │
├──────────────────────────────────────────┤
│                                          │
│  Preview Image                          │
│  ┌─────────────────────────────┐        │
│  │                             │        │
│  │     [Preview Image]         │        │
│  │                             │        │
│  └─────────────────────────────┘        │
│                                          │
│  Render Settings:                       │
│  ┌──────────────────────────────────┐   │
│  │ Quality:     [High ▼]            │   │
│  │ Style:       [Photorealistic ▼]  │   │
│  │ Aspect:      [16:9 ▼]            │   │
│  │ Credits:     10                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Advanced Options [▼]                    │
│  ┌──────────────────────────────────┐   │
│  │ Model: [Imagen 3.0 Standard ▼]   │   │
│  │ Prompt: [Optional custom...]     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Cancel]              [🎨 Render (10)] │
└──────────────────────────────────────────┘
```

### 2. Progress Indicator

**During Render:**
```
┌──────────────────────────────────────────┐
│ Rendering in Progress...                 │
├──────────────────────────────────────────┤
│                                          │
│  ⏳ Processing render                    │
│                                          │
│  ████████████░░░░░░░░  60%              │
│                                          │
│  Estimated time remaining: 15 seconds    │
│                                          │
│  [Cancel Render]                         │
└──────────────────────────────────────────┘
```

### 3. Result Display

**Render Complete:**
```
┌──────────────────────────────────────────┐
│ Render Complete!                         │
├──────────────────────────────────────────┤
│                                          │
│  Before → After                          │
│  ┌────────┐    ┌────────┐               │
│  │ Original│ → │ Rendered│               │
│  └────────┘    └────────┘               │
│                                          │
│  [Download] [Share] [Render Again]      │
│  [Compare] [Save to Project]            │
│                                          │
└──────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. API Integration

**Using Renderiq Python SDK:**
```csharp
// C# wrapper for Python SDK
public class RenderiqClient
{
    private string accessToken;
    
    public async Task<RenderResult> CreateRender(
        string imagePath,
        RenderSettings settings)
    {
        // Use Python SDK via subprocess or .NET wrapper
        // See Python SDK documentation
    }
}
```

**Direct API Calls:**
```csharp
public class RenderiqAPI
{
    private const string API_BASE = "https://renderiq.io/api/plugins";
    
    public async Task<string> SignIn(string email, string password)
    {
        // POST /auth/signin
        // Returns access_token
    }
    
    public async Task<RenderResponse> CreateRender(
        byte[] imageData,
        RenderSettings settings)
    {
        // POST /renders
        // Multipart form data
    }
}
```

### 2. View Export

**Export Current View:**
```csharp
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

public ImageData ExportCurrentView(UIApplication app)
{
    UIDocument uidoc = app.ActiveUIDocument;
    View activeView = uidoc.ActiveView;
    
    // Export to image
    ImageExportOptions options = new ImageExportOptions();
    options.ExportRange = ExportRange.CurrentView;
    options.ZoomType = ZoomFitType.FitToPage;
    options.PixelSize = 4096; // 4K
    
    // Capture to memory
    // Process image
    // Return image bytes
}
```

### 3. Event Handling

**Application Events:**
```csharp
public class RenderiqApplication : IExternalApplication
{
    public Result OnStartup(UIControlledApplication application)
    {
        // Create ribbon panel
        // Register events
        // Initialize SDK
        
        return Result.Succeeded;
    }
    
    public Result OnShutdown(UIControlledApplication application)
    {
        // Cleanup
        return Result.Succeeded;
    }
}
```

---

## Deployment

### 1. Installation Package

**MSI Installer:**
- Silent install option for enterprise
- Auto-detects Revit versions
- Adds to all Revit installations
- Creates shortcuts

**File Locations:**
```
%APPDATA%\Autodesk\Revit\Addins\2024\
  └── RenderiqRevitPlugin.addin

%PROGRAMFILES%\Renderiq\
  ├── RenderiqRevitPlugin.dll
  ├── RenderiqAPI.dll
  └── Assets\
```

### 2. Enterprise Deployment

**GPO/Intune Deployment:**
- MSI silent install
- Auto-configuration via registry
- Centralized settings management
- License key distribution

### 3. Update Mechanism

**Auto-Update:**
- Check for updates on startup
- Background download
- Prompt user to restart
- Version management

---

## Performance Considerations

### 1. View Export Optimization

- **Async Export**: Non-blocking view export
- **Compression**: JPEG compression for uploads
- **Caching**: Cache exported views for re-renders
- **Resolution Scaling**: Auto-adjust based on quality setting

### 2. Network Handling

- **Resumable Uploads**: For large files (>50MB)
- **Background Upload**: Don't block UI
- **Retry Logic**: Automatic retry on failure
- **Offline Queue**: Queue renders when offline

### 3. Memory Management

- **Dispose Images**: Proper cleanup
- **Stream Processing**: Don't load entire image into memory
- **Garbage Collection**: Force GC after large operations

---

## Security

### 1. Credential Storage

- **Windows Credential Manager**: Store tokens securely
- **Encrypted Storage**: Encrypt API keys
- **Token Refresh**: Automatic token refresh
- **No Hardcoded Secrets**: All credentials from secure storage

### 2. API Security

- **HTTPS Only**: All API calls over HTTPS
- **Certificate Pinning**: Verify API certificates
- **Request Signing**: Sign critical requests
- **Rate Limiting**: Respect API rate limits

---

## Localization

**Supported Languages:**
- English (default)
- Spanish
- French
- German
- Chinese (Simplified)
- Japanese

**Localization Files:**
- Resource files (.resx) for each language
- Right-to-left (RTL) support for Arabic/Hebrew
- Date/time formatting per locale
- Number formatting per locale

---

## Testing Strategy

### 1. Unit Tests

- API client tests
- View export tests
- Settings persistence tests
- Error handling tests

### 2. Integration Tests

- Full render workflow
- Multi-view rendering
- Queue management
- Credit deduction

### 3. User Acceptance Testing

- Architect workflows
- Large project testing
- Performance benchmarking
- UI/UX validation

---

## Support & Documentation

### 1. In-App Help

- **F1 Help**: Context-sensitive help
- **Tooltips**: Detailed tooltips on all controls
- **Video Tutorials**: Embedded video links
- **Sample Projects**: Included sample files

### 2. External Resources

- **Documentation Site**: docs.renderiq.io/revit
- **Video Library**: YouTube channel
- **Community Forum**: forum.renderiq.io
- **Support Email**: revit-support@renderiq.io

---

## Roadmap

### Phase 1 (MVP)
- ✅ Basic rendering
- ✅ View export
- ✅ Settings dialog
- ✅ Credit display

### Phase 2 (Enhanced)
- ⏳ Batch rendering
- ⏳ Render history
- ⏳ Project organization
- ⏳ Custom styles

### Phase 3 (Advanced)
- ⏳ Live preview
- ⏳ Material override
- ⏳ Lighting adjustments
- ⏳ VR export

---

## Success Metrics

**Adoption Metrics:**
- Plugin installations per month
- Active users per month
- Renders per active user
- Time to first render

**Engagement Metrics:**
- Daily active users
- Average renders per session
- Credit consumption
- Feature usage

**Technical Metrics:**
- Crash rate
- Performance benchmarks
- API response times
- Error rates

---

## Resources

- **Revit API Docs**: https://www.revitapidocs.com/
- **Revit SDK**: Included with Revit installation
- **Renderiq API Docs**: https://docs.renderiq.io/plugins
- **Python SDK**: https://github.com/renderiq/renderiq-plugin-sdk-python

