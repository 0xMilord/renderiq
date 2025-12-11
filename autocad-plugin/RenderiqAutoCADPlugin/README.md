# Renderiq AutoCAD Plugin

AI-powered rendering plugin for Autodesk AutoCAD that integrates seamlessly with the Renderiq platform.

## Features

- **One-Click Rendering**: Render any AutoCAD view with AI-powered photorealistic rendering
- **Multiple Quality Options**: Standard, High, and Ultra quality presets
- **Style Presets**: Photorealistic, Dramatic, Soft, Studio, and Natural styles
- **Project Management**: Organize renders into projects
- **Credit Management**: View and manage your Renderiq credits
- **Secure Authentication**: Secure token storage using Windows DPAPI
- **Resumable Uploads**: Support for large file uploads
- **Webhook Support**: Optional webhook callbacks for render status updates

## Requirements

- Autodesk AutoCAD 2020 or later
- Windows 10/11
- .NET Framework 4.8
- Active Renderiq account (sign up at https://renderiq.io)

## Installation

### Bundle Installation (AutoCAD 2013+)

1. Download the latest release
2. Extract the ZIP file
3. Copy the `Renderiq.bundle` folder to:
   - **For all users**: `C:\ProgramData\Autodesk\ApplicationPlugins\`
   - **For current user**: `%APPDATA%\Autodesk\ApplicationPlugins\`
4. Restart AutoCAD

### Manual Installation

1. Copy `RenderiqAutoCADPlugin.dll` to your AutoCAD Support folder
2. Load using `NETLOAD` command
3. Type `RENDERIQ` to start using

## Usage

### First Time Setup

1. Open AutoCAD
2. Navigate to the **Add-Ins** tab
3. Click the **Renderiq** panel
4. Click **Settings** to sign in with your Renderiq account
5. Enter your email and password, then click **Sign In**

### Rendering a View

1. Open the drawing you want to render
2. Set the view you want to render
3. Type `RENDERIQ` (or `RIR`) command or click the **Render** button
4. In the render dialog:
   - Select quality (Standard, High, or Ultra)
   - Choose a style preset
   - Select aspect ratio
   - Review credit cost
5. Click **🎨 Render**
6. Wait for the render to complete (usually 10-30 seconds)
7. View the result in the result dialog

### Command Aliases

Create these aliases in `acad.pgp` for quick access:
```
RIR, *RENDERIQ
RIS, *RENDERIQSETTINGS
RIC, *RENDERIQCREDITS
RIQ, *RENDERIQQUEUE
```

## Architecture

The plugin follows a clean architecture pattern matching the Revit plugin:

```
RenderiqAutoCADPlugin/
├── Commands/          # AutoCAD CommandMethod implementations
├── Services/          # Business logic layer
│   ├── RenderiqApiClient.cs    # API client (follows app architecture)
│   ├── ViewExporter.cs         # View export service
│   └── SettingsManager.cs      # Settings & credential management
├── Models/            # Data models (matches API schemas)
├── UI/                # WPF dialogs
└── Properties/        # Assembly info
```

### API Integration

The plugin integrates with the unified Renderiq Plugin API (`/api/plugins/*`) and follows the same patterns as the web application:

- **Authentication**: Bearer token-based authentication
- **API Client**: Centralized `RenderiqApiClient` service
- **Error Handling**: Standardized error responses
- **Rate Limiting**: Respects API rate limits
- **Telemetry**: Includes platform metadata in all requests

## Documentation

- [Build Instructions](BUILD.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [AutoCAD Plugin Guide](../../docs/AUTOCAD_PLUGIN_GUIDE.md)

## Support

For issues, questions, or feature requests:
- GitHub Issues
- Email: support@renderiq.io
- Documentation: https://renderiq.io/docs

