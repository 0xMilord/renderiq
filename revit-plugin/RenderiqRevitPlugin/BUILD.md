# Build Instructions

## Prerequisites

1. **Visual Studio 2019 or later**
   - Install with .NET desktop development workload
   - .NET Framework 4.8 Developer Pack

2. **Autodesk Revit 2020 or later**
   - Revit SDK (included with Revit installation)
   - Typical SDK location: `C:\Program Files\Autodesk\Revit 2024\SDK`

3. **NuGet Packages** (restored automatically)
   - Newtonsoft.Json (13.0.3)
   - System.Net.Http (4.3.4)

## Build Steps

### 1. Clone and Open Project

```bash
git clone <repository-url>
cd revit-plugin/RenderiqRevitPlugin
```

Open `RenderiqRevitPlugin.sln` in Visual Studio.

### 2. Update Revit API References

The project references point to Revit 2024 by default. If you're using a different version:

1. Right-click **References** in Solution Explorer
2. Remove `RevitAPI` and `RevitAPIUI` references
3. Add new references:
   - Browse to `C:\Program Files\Autodesk\Revit [YOUR_VERSION]\RevitAPI.dll`
   - Browse to `C:\Program Files\Autodesk\Revit [YOUR_VERSION]\RevitAPIUI.dll`
4. Set **Copy Local** to `False` for both references

### 3. Update .addin File

Edit `RenderiqRevitPlugin.addin`:

```xml
<SupportedSoftwareVersion>2024.0</SupportedSoftwareVersion>
<MinimalSupportedSoftwareVersion>2020.0</MinimalSupportedSoftwareVersion>
```

Change to match your target Revit version.

### 4. Build Configuration

1. Select **Release** configuration (recommended for production)
2. Select target platform: **x64**
3. Build Solution (Ctrl+Shift+B)

### 5. Output Files

After building, you'll find:

- `bin/Release/RenderiqRevitPlugin.dll` - Main plugin DLL
- `RenderiqRevitPlugin.addin` - Add-in manifest file

## Installation

### Development Installation

1. Copy `RenderiqRevitPlugin.dll` to your build output directory
2. Copy `RenderiqRevitPlugin.addin` to your Revit Add-ins folder:
   - **User folder**: `%APPDATA%\Autodesk\Revit\Addins\2024\`
   - **All users**: `C:\ProgramData\Autodesk\Revit\Addins\2024\`
3. Edit the `.addin` file and update the `<Assembly>` path to point to your DLL location:
   ```xml
   <Assembly>C:\Path\To\Your\Build\Output\RenderiqRevitPlugin.dll</Assembly>
   ```

### Production Deployment

1. Create a deployment package:
   ```
   RenderiqRevitPlugin/
   ├── RenderiqRevitPlugin.dll
   ├── RenderiqRevitPlugin.addin
   └── Icons/ (optional, if using custom icons)
   ```

2. Create an installer (MSI recommended for enterprise):
   - Install DLL to `%APPDATA%\Autodesk\Revit\Addins\[VERSION]\`
   - Install .addin file to same location
   - Update Assembly path in .addin file during installation

## Troubleshooting Build Issues

### Error: "Cannot find RevitAPI.dll"

**Solution**: Update the reference paths in the project file or manually browse to the correct Revit installation folder.

### Error: "Target framework not found"

**Solution**: Install .NET Framework 4.8 Developer Pack from Microsoft.

### Error: "NuGet package restore failed"

**Solution**: 
1. Right-click solution → Restore NuGet Packages
2. Check internet connection
3. Verify NuGet package source is accessible

### Build succeeds but plugin doesn't load

**Check**:
1. `.addin` file is in correct location
2. `<Assembly>` path in `.addin` file is correct
3. DLL exists at specified path
4. Revit version matches `SupportedSoftwareVersion`
5. Check Revit journal file for errors

## Code Signing (Optional)

For production deployments, consider code signing:

1. Obtain a code signing certificate
2. Right-click project → Properties → Signing
3. Select certificate and enable signing
4. This prevents Windows SmartScreen warnings

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build Revit Plugin

on: [push, pull_request]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup MSBuild
        uses: microsoft/setup-msbuild@v1
      - name: Build
        run: msbuild RenderiqRevitPlugin.sln /p:Configuration=Release
      - name: Package
        run: |
          mkdir release
          copy bin\Release\RenderiqRevitPlugin.dll release\
          copy RenderiqRevitPlugin.addin release\
```

## Version Management

Update version in:
1. `Properties/AssemblyInfo.cs`
2. `RenderiqRevitPlugin.addin` (if needed)
3. `README.md` (changelog)

## Testing

After building:
1. Install plugin to Revit Add-ins folder
2. Restart Revit
3. Verify plugin appears in Add-Ins tab
4. Test authentication
5. Test rendering with sample view
6. Verify all dialogs work correctly

