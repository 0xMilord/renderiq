# Renderiq Revit Plugin

AI-powered rendering plugin for Autodesk Revit that integrates seamlessly with the Renderiq platform.

## Features

- **One-Click Rendering**: Render any Revit view with AI-powered photorealistic rendering
- **Multiple Quality Options**: Standard, High, and Ultra quality presets
- **Style Presets**: Photorealistic, Dramatic, Soft, Studio, and Natural styles
- **Project Management**: Organize renders into projects
- **Credit Management**: View and manage your Renderiq credits
- **Secure Authentication**: Secure token storage using Windows DPAPI
- **Resumable Uploads**: Support for large file uploads with resumable upload capability
- **Webhook Support**: Optional webhook callbacks for render status updates

## Requirements

- Autodesk Revit 2020 or later
- Windows 10/11
- .NET Framework 4.8
- Active Renderiq account (sign up at https://renderiq.io)

## Installation

### Manual Installation

1. Download the latest release from the [Releases](../../releases) page
2. Extract the ZIP file
3. Copy `RenderiqRevitPlugin.dll` and `RenderiqRevitPlugin.addin` to your Revit Add-ins folder:
   - **For all users**: `C:\ProgramData\Autodesk\Revit\Addins\2024\` (replace 2024 with your Revit version)
   - **For current user**: `%APPDATA%\Autodesk\Revit\Addins\2024\`
4. Restart Revit

### Build from Source

1. Clone this repository
2. Open `RenderiqRevitPlugin.sln` in Visual Studio 2019 or later
3. Ensure you have:
   - Revit SDK installed (point project references to your Revit installation)
   - .NET Framework 4.8 Developer Pack
4. Build the solution (Release configuration recommended)
5. Copy the built DLL and `.addin` file to your Revit Add-ins folder

## Usage

### First Time Setup

1. Open Revit
2. Navigate to the **Add-Ins** tab
3. Click the **Renderiq** panel
4. Click **Settings** to sign in with your Renderiq account
5. Enter your email and password, then click **Sign In**

### Rendering a View

1. Open the view you want to render in Revit
2. Click the **Render** button in the Renderiq ribbon panel
3. In the render dialog:
   - Select quality (Standard, High, or Ultra)
   - Choose a style preset
   - Select aspect ratio
   - Review credit cost
4. Click **🎨 Render**
5. Wait for the render to complete (usually 10-30 seconds)
6. View the result in the result dialog

### Managing Credits

- Click **Credits** in the ribbon panel to view your balance
- Click **Top Up Credits** to purchase more credits
- Low credit warnings appear when balance is below 20 credits

### Project Management

- Click **Projects** to view and manage your Renderiq projects
- Select a default project for automatic organization
- Create new projects from within the plugin

## Architecture

The plugin follows a clean architecture pattern:

```
RenderiqRevitPlugin/
├── Commands/          # IExternalCommand implementations
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

### Security

- **Token Storage**: Uses Windows DPAPI for secure credential storage
- **API Keys**: Optional API key support for enterprise deployments
- **HTTPS Only**: All API communication uses HTTPS

## Configuration

Settings are stored in Windows Registry:
- Location: `HKEY_CURRENT_USER\SOFTWARE\Renderiq\RevitPlugin`
- Settings include: default quality, style, aspect ratio, export resolution
- Tokens are encrypted using Windows DPAPI

## Troubleshooting

### Plugin doesn't appear in Revit

- Verify the `.addin` file is in the correct Add-ins folder
- Check that the DLL path in the `.addin` file is correct
- Ensure Revit version matches (check SupportedSoftwareVersion in .addin file)
- Check Revit's journal file for errors

### Authentication fails

- Verify your email and password are correct
- Check your internet connection
- Ensure firewall/antivirus isn't blocking HTTPS connections
- Try signing out and signing in again

### Renders fail

- Check your credit balance
- Verify the view is valid (3D views recommended)
- Check network connectivity
- Review error messages in the render dialog

### Performance Issues

- Large views may take longer to export
- Use Standard quality for faster renders during testing
- Close other applications to free up resources

## Development

### Project Structure

- **Commands/**: Revit command implementations
- **Services/**: Business logic and API integration
- **Models/**: Data transfer objects matching API schemas
- **UI/**: WPF user interface dialogs

### Adding New Features

1. Add API methods to `RenderiqApiClient.cs`
2. Update models in `Models/ApiModels.cs` if needed
3. Create UI dialogs in `UI/` folder
4. Add commands in `Commands/` folder
5. Update ribbon panel in `RenderiqApplication.cs`

### Testing

- Test with various view types (3D, plans, elevations)
- Test with different quality settings
- Verify error handling for network failures
- Test authentication flow and token refresh

## API Endpoints Used

The plugin uses the following Renderiq Plugin API endpoints:

- `POST /api/plugins/auth/signin` - User authentication
- `GET /api/plugins/auth/me` - Get user information
- `POST /api/plugins/auth/refresh` - Refresh access token
- `GET /api/plugins/credits` - Get credit balance
- `POST /api/plugins/renders` - Create render request
- `GET /api/plugins/renders/{renderId}` - Get render status
- `GET /api/plugins/projects` - List projects
- `POST /api/plugins/projects` - Create project
- `POST /api/plugins/uploads/resumable/init` - Initialize resumable upload
- `POST /api/plugins/uploads/resumable/{sessionId}/finalize` - Finalize upload

## License

Copyright © Renderiq 2024. All rights reserved.

## Support

For issues, questions, or feature requests:
- GitHub Issues: [Create an issue](../../issues)
- Email: support@renderiq.io
- Documentation: https://renderiq.io/docs

## Changelog

### Version 1.0.0
- Initial release
- Basic rendering functionality
- Authentication and project management
- Credit management
- Settings dialog

