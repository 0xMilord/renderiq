# Renderiq AutoCAD Plugin - Architecture Documentation

## Overview

The Renderiq AutoCAD Plugin follows the same architectural patterns as the Revit plugin and main Renderiq application, ensuring consistency across all platforms.

## Architecture Alignment

### Same Patterns as Revit Plugin

The AutoCAD plugin uses identical architecture patterns:

1. **Unified Plugin API**: `/api/plugins/*` endpoints
2. **Service Layer**: `RenderiqApiClient`, `ViewExporter`, `SettingsManager`
3. **Models**: Same DTOs matching OpenAPI schema
4. **Error Handling**: Centralized error handling
5. **Security**: Windows DPAPI for credential storage

### AutoCAD-Specific Differences

**API Differences:**
- Uses `IExtensionApplication` instead of `IExternalApplication`
- Uses `CommandMethod` attribute instead of `IExternalCommand`
- Uses AutoCAD Ribbon API instead of Revit Ribbon API
- View export uses AutoCAD Plot/Graphics API

**UI Differences:**
- WPF dialogs are identical structure
- Both use standard WPF `ShowDialog()` method

## Code Structure

```
RenderiqAutoCADPlugin/
├── RenderiqApplication.cs      # IExtensionApplication implementation
├── Commands/                   # AutoCAD CommandMethod commands
│   ├── RenderiqCommand.cs
│   ├── CreditsCommand.cs
│   ├── SettingsCommand.cs
│   ├── ProjectsCommand.cs
│   └── QueueCommand.cs
├── Services/                   # Business logic (same as Revit)
│   ├── RenderiqApiClient.cs   # Identical to Revit version
│   ├── ViewExporter.cs        # AutoCAD-specific view export
│   └── SettingsManager.cs     # Same implementation
├── Models/                     # Identical to Revit
│   └── ApiModels.cs
├── UI/                         # WPF dialogs (same structure as Revit)
│   ├── RenderDialog.xaml
│   ├── LoginDialog.xaml
│   ├── CreditsDialog.xaml
│   ├── SettingsDialog.xaml
│   └── ProjectsDialog.xaml
└── Utils/                      # Utilities
    ├── Logger.cs
    └── ErrorHandler.cs
```

## API Integration

**Identical to Revit Plugin:**
- Same `RenderiqApiClient` implementation
- Same authentication flow
- Same error handling
- Same project/credits management

**Platform Identification:**
- `X-Renderiq-Platform: autocad` header
- `User-Agent: Renderiq-AutoCAD-Plugin/1.0.0` header

## View Export

AutoCAD view export differs from Revit:

**AutoCAD Approach:**
- Uses Plot API for viewport rendering
- Can export model space or paper space
- Supports selected objects export
- Uses GraphicsInterface for direct rendering

**Implementation Notes:**
- Current implementation uses fallback screenshot method
- Production should use Plot API or GraphicsInterface
- Requires more complex viewport extraction

## Command Registration

**AutoCAD Commands:**
```csharp
[CommandMethod("RENDERIQ")]
public void RenderCommand() { ... }
```

**Bundle Manifest:**
- Uses `PackageContents.xml` for AutoCAD 2013+
- Commands defined in manifest
- Auto-loads on AutoCAD startup

## Security

**Same as Revit Plugin:**
- Windows DPAPI for token storage
- Registry location: `SOFTWARE\Renderiq\AutoCADPlugin`
- Encrypted credential storage
- API key support

## Testing

**Test Scenarios:**
1. Authentication flow
2. View export (model space, paper space)
3. Render creation and polling
4. Error handling
5. Multi-document scenarios

## Future Enhancements

1. **View Export**: Implement proper Plot API integration
2. **Selected Objects**: Support rendering selected entities only
3. **Layout Support**: Export paper space layouts
4. **Batch Rendering**: Render multiple views
5. **Queue Management**: Local queue for offline renders

## Conclusion

The AutoCAD plugin maintains architectural consistency with:
- ✅ Same API client and patterns
- ✅ Same authentication mechanisms  
- ✅ Same error handling approach
- ✅ Same service layer structure
- ✅ Same data models
- ✅ Same security practices

Only AutoCAD-specific API differences (command registration, view export) differ from Revit plugin.

