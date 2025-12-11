# Build Instructions - AutoCAD Plugin

## Prerequisites

1. **Visual Studio 2019 or later**
   - Install with .NET desktop development workload
   - .NET Framework 4.8 Developer Pack

2. **Autodesk AutoCAD 2020 or later**
   - AutoCAD .NET API (included with AutoCAD installation)
   - Typical DLL location: `C:\Program Files\Autodesk\AutoCAD 2024\`

3. **NuGet Packages** (restored automatically)
   - Newtonsoft.Json (13.0.3)
   - System.Net.Http (4.3.4)

## Build Steps

### 1. Clone and Open Project

```bash
cd autocad-plugin/RenderiqAutoCADPlugin
```

Open `RenderiqAutoCADPlugin.sln` in Visual Studio.

### 2. Update AutoCAD API References

The project references point to AutoCAD 2024 by default. If you're using a different version:

1. Right-click **References** in Solution Explorer
2. Remove `AcDbMgd`, `AcMgd`, and `AcCui` references
3. Add new references:
   - Browse to `C:\Program Files\Autodesk\AutoCAD [YOUR_VERSION]\AcDbMgd.dll`
   - Browse to `C:\Program Files\Autodesk\AutoCAD [YOUR_VERSION]\AcMgd.dll`
   - Browse to `C:\Program Files\Autodesk\AutoCAD [YOUR_VERSION]\AcCui.dll`
4. Set **Copy Local** to `False` for all references

### 3. Update PackageContents.xml

Edit `PackageContents.xml`:

```xml
<SeriesMin>R24.0</SeriesMin>
<SeriesMax>R24.9</SeriesMax>
```

Change to match your target AutoCAD version (R24.0 = 2024, R23.0 = 2023, etc.)

### 4. Build Configuration

1. Select **Release** configuration (recommended for production)
2. Select target platform: **x64**
3. Build Solution (Ctrl+Shift+B)

### 5. Output Files

After building, you'll find:

- `bin/Release/RenderiqAutoCADPlugin.dll` - Main plugin DLL
- `PackageContents.xml` - Bundle manifest file

## Installation

### Bundle Installation (AutoCAD 2013+)

1. Create bundle folder structure:
   ```
   Renderiq.bundle\
   ├── PackageContents.xml
   ├── RenderiqAutoCADPlugin.dll
   └── Icons\ (optional)
   ```

2. Copy bundle folder to:
   - **User folder**: `%APPDATA%\Autodesk\ApplicationPlugins\`
   - **All users**: `C:\ProgramData\Autodesk\ApplicationPlugins\`

3. Restart AutoCAD

### Manual Installation

1. Copy `RenderiqAutoCADPlugin.dll` to AutoCAD Support folder
2. Load using `NETLOAD` command
3. Type `RENDERIQ` to start using

## Troubleshooting Build Issues

### Error: "Cannot find AcDbMgd.dll"

**Solution**: Update the reference paths in the project file or manually browse to the correct AutoCAD installation folder.

### Error: "Target framework not found"

**Solution**: Install .NET Framework 4.8 Developer Pack from Microsoft.

### Error: "NuGet package restore failed"

**Solution**: 
1. Right-click solution → Restore NuGet Packages
2. Check internet connection
3. Verify NuGet package source is accessible

### Build succeeds but plugin doesn't load

**Check**:
1. Bundle folder is in correct location
2. `PackageContents.xml` is correct
3. DLL exists at specified path
4. AutoCAD version matches SeriesMin/SeriesMax
5. Check AutoCAD command line for errors

## Testing

After building:
1. Install plugin to ApplicationPlugins folder
2. Restart AutoCAD
3. Verify plugin appears in Add-Ins tab
4. Test authentication
5. Test rendering with sample drawing
6. Verify all dialogs work correctly

