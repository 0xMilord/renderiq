# Changelog

All notable changes to the Renderiq Revit Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Renderiq Revit Plugin
- One-click rendering from any Revit view
- Authentication with Renderiq platform
- Credit balance display and management
- Project management (list, create, select)
- Settings dialog with default preferences
- Multiple quality presets (Standard, High, Ultra)
- Style presets (Photorealistic, Dramatic, Soft, Studio, Natural)
- Aspect ratio selection (16:9, 4:3, 1:1, 9:16)
- Resumable upload support for large files
- Webhook callback support
- Secure token storage using Windows DPAPI
- Ribbon panel integration
- Keyboard shortcut support (Ctrl+R for render)

### Security
- Secure credential storage using Windows DPAPI
- HTTPS-only API communication
- Optional API key support for enterprise deployments

### Architecture
- Unified API client following app architecture patterns
- Clean separation of concerns (Commands, Services, Models, UI)
- Error handling with standardized error responses
- Platform telemetry (platform, version, user agent headers)

