# Renderiq Revit Plugin - Architecture Documentation

## Overview

The Renderiq Revit Plugin is built following the same architectural patterns as the main Renderiq application, ensuring consistency, maintainability, and reusability of patterns.

## Architecture Alignment

### 1. Unified Plugin API Integration

The plugin integrates with the **unified `/api/plugins/*` API** endpoints, following the same patterns as other plugins (SketchUp, Blender, etc.):

- ✅ **Endpoint Consistency**: Uses `/api/plugins/renders`, `/api/plugins/auth/*`, etc.
- ✅ **Platform Headers**: Includes `X-Renderiq-Platform: revit` and `User-Agent` headers
- ✅ **Telemetry**: Automatically includes platform, version, and user agent metadata

### 2. Service Layer Pattern

Following the app's service layer architecture:

```
Services/
├── RenderiqApiClient.cs    # API client (equivalent to API routes in app)
├── ViewExporter.cs          # View export service (equivalent to storage service)
└── SettingsManager.cs       # Settings & credentials (equivalent to auth service)
```

**RenderiqApiClient** mirrors the app's API structure:
- Handles all HTTP communication
- Centralized error handling
- Token management
- Follows same request/response patterns as backend API

### 3. Data Access Layer (DAL) Pattern

While the plugin doesn't have a traditional DAL (it uses API calls), the **Models** directory follows the same data transfer object pattern:

```
Models/
└── ApiModels.cs    # DTOs matching API schema (same structure as app's types)
```

All models match the OpenAPI specification used by the backend, ensuring type safety and consistency.

### 4. Authentication Architecture

Follows the app's authentication patterns:

- **Bearer Token Authentication**: Uses same token format as web app
- **Token Storage**: Secure storage using Windows DPAPI (equivalent to cookie-based storage in web)
- **Token Refresh**: Implements refresh token flow matching `/api/plugins/auth/refresh`
- **API Key Support**: Optional API key authentication (matching `X-Api-Key` header pattern)

### 5. Error Handling

Centralized error handling following app patterns:

```
Utils/
├── ErrorHandler.cs    # Centralized error handling (equivalent to plugin-error-codes.ts)
└── Logger.cs          # Logging utility (equivalent to logger.ts)
```

**ErrorHandler** provides:
- Standardized error codes matching backend `PluginErrorCode` enum
- User-friendly error messages
- Proper exception propagation

### 6. Rate Limiting & Observability

- ✅ **Rate Limit Headers**: Respects `X-RateLimit-*` headers from API
- ✅ **Telemetry**: All requests include platform metadata
- ✅ **Error Tracking**: Logs errors for debugging (can integrate with Sentry)

### 7. Storage Pattern

For file uploads, follows app's storage architecture:

- **Direct Upload**: Uses multipart/form-data (same as web app)
- **Resumable Uploads**: Supports `/api/plugins/uploads/resumable/*` endpoints
- **GCS Integration**: Uses same GCS resumable upload flow as backend

### 8. UI Architecture

While Revit uses WPF (different from Next.js), the UI structure mirrors app patterns:

```
UI/
├── RenderDialog.xaml      # Main render UI (equivalent to render-form.tsx)
├── LoginDialog.xaml       # Authentication UI (equivalent to login page)
├── CreditsDialog.xaml     # Credits display (equivalent to billing components)
├── ProjectsDialog.xaml    # Project management (equivalent to projects UI)
└── SettingsDialog.xaml    # Settings (equivalent to settings page)
```

Each dialog follows:
- **Separation of Concerns**: XAML for layout, code-behind for logic
- **State Management**: Uses view models where appropriate
- **API Integration**: All dialogs use `RenderiqApiClient` service

## Code Structure Comparison

### Backend (App) Structure
```
app/api/plugins/
├── renders/route.ts          # Render endpoint
├── auth/signin/route.ts      # Auth endpoint
├── credits/route.ts          # Credits endpoint
└── projects/route.ts         # Projects endpoint

lib/services/
├── ai-sdk-service.ts         # AI processing
├── storage.ts                # File storage
└── webhooks.ts               # Webhook handling

lib/utils/
├── plugin-auth.ts            # Auth utilities
├── plugin-error-codes.ts     # Error codes
└── platform-detection.ts     # Platform detection
```

### Plugin Structure (Matches Patterns)
```
Services/
├── RenderiqApiClient.cs      # Calls above endpoints
├── ViewExporter.cs           # Exports views (like storage service)
└── SettingsManager.cs        # Manages auth state (like plugin-auth.ts)

Commands/
├── RenderiqRenderCommand.cs  # Triggers render (like render-form.tsx)
├── RenderiqCreditsCommand.cs # Shows credits
└── RenderiqSettingsCommand.cs # Opens settings

Utils/
├── ErrorHandler.cs           # Like plugin-error-codes.ts
└── Logger.cs                 # Like logger.ts

Models/
└── ApiModels.cs              # DTOs matching API schemas
```

## Key Architectural Decisions

### 1. API Client as Single Source of Truth

All API communication goes through `RenderiqApiClient`, ensuring:
- Consistent error handling
- Centralized token management
- Easy to update when API changes
- Matches backend API structure exactly

### 2. Settings Manager as Auth Service

`SettingsManager` acts like the app's auth service:
- Secure credential storage (DPAPI equivalent to secure cookies)
- Token persistence across sessions
- Settings management (like user preferences in app)

### 3. Command Pattern for UI Actions

Revit commands follow the same pattern as Next.js server actions:
- Commands trigger operations
- Services handle business logic
- Models define data structures
- UI displays results

### 4. Error Handling Consistency

`ErrorHandler` provides the same error codes and messages as the backend, ensuring users see consistent errors whether using the web app or plugin.

## Integration Points

### 1. Authentication Flow

```
User signs in → RenderiqApiClient.SignInAsync() 
             → POST /api/plugins/auth/signin
             → Returns access_token & refresh_token
             → SettingsManager.SaveAccessToken()
             → Token stored securely (DPAPI)
```

Matches web app flow:
```
User signs in → POST /api/auth/signin
             → Returns session cookie
             → Stored in secure httpOnly cookie
```

### 2. Render Flow

```
User clicks Render → ViewExporter.ExportViewToImage()
                  → RenderiqApiClient.CreateRenderAsync()
                  → POST /api/plugins/renders
                  → Polls GET /api/plugins/renders/{renderId}
                  → Shows ResultDialog
```

Matches web app flow:
```
User submits form → handleRenderRequest()
                → POST /api/renders
                → Polls render status
                → Updates UI
```

### 3. Credits Flow

```
User clicks Credits → RenderiqApiClient.GetCreditsAsync()
                   → GET /api/plugins/credits
                   → Displays in CreditsDialog
```

Matches web app flow:
```
Page loads → Server action gets credits
          → GET /api/billing/credits
          → Displays in UI
```

## Testing Strategy

Following app testing patterns:

1. **Unit Tests**: Test services independently (like app's unit tests)
2. **Integration Tests**: Test API integration (like app's integration tests)
3. **E2E Tests**: Test full render workflow in Revit (like app's E2E tests)

## Future Enhancements

To maintain architectural alignment:

1. **Webhook Receiver**: Add local webhook receiver for real-time updates
2. **Offline Queue**: Implement local queue for offline renders (matches app's offline strategy)
3. **Metrics**: Send telemetry to same monitoring service as app
4. **Caching**: Implement response caching (like app's caching strategy)

## Conclusion

The Revit plugin maintains architectural consistency with the main Renderiq application:

- ✅ Same API endpoints and patterns
- ✅ Same authentication mechanisms
- ✅ Same error handling approach
- ✅ Same service layer structure
- ✅ Same data models
- ✅ Same security practices

This ensures:
- **Consistency**: Users have the same experience across platforms
- **Maintainability**: Changes to API easily propagate to plugin
- **Reliability**: Same error handling and validation logic
- **Security**: Same security practices and token management

