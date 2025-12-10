# SketchUp Plugin - Authentication & Billing Integration

## Overview

The SketchUp plugin now includes full authentication, credit management, and billing integration with the main Renderiq application.

## Features Added

### 1. Authentication System
- **Login Dialog**: Users can login with email/password
- **Token Management**: Access tokens stored securely in SketchUp model
- **Auto-login**: Tokens are validated and reused
- **Logout**: Users can logout to clear tokens

### 2. Credit Management
- **Credit Checking**: Checks balance before rendering
- **Credit Display**: Shows current balance and usage
- **Insufficient Credits Dialog**: Warns when credits are low
- **Top-up Integration**: Direct links to billing page

### 3. Billing Integration
- **Top-up Links**: Direct links to pricing page
- **Credit Refresh**: Real-time credit balance updates
- **Usage Tracking**: Shows total earned/spent

## API Endpoints

All endpoints are under `/api/sketchup-extension/` namespace:

### 1. Authentication Endpoints

**POST `/api/sketchup-extension/auth/signin`**
- Accepts: `{ email, password }`
- Returns: `{ success, access_token, token_type, expires_at, user }`
- Purpose: Authenticate user and get access token

**GET `/api/sketchup-extension/auth/me`**
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, user: { id, email, created_at } }`
- Purpose: Get current user info from token

### 2. Credits Endpoints

**GET `/api/sketchup-extension/credits`**
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, credits: { balance, totalEarned, totalSpent } }`
- Purpose: Get user's credit balance

### 3. Render Endpoints

**POST `/api/sketchup-extension/renders`**
- Headers: `Authorization: Bearer <token>`
- Accepts: FormData (multipart/form-data)
- Returns: `{ success, data: { renderId }, error }`
- Purpose: Create render request (wraps main render handler)

**GET `/api/sketchup-extension/renders/:renderId`**
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, status, outputUrl, error, createdAt, updatedAt }`
- Purpose: Get render status

## Implementation Notes

### Token Storage
- Tokens stored in SketchUp model attributes
- Should be encrypted in production
- Validated before each use

### Credit Checking Flow
1. User initiates render
2. Plugin checks authentication
3. Plugin calculates credits cost
4. Plugin checks credit balance
5. If insufficient, shows dialog with top-up link
6. If sufficient, proceeds with render

### Error Handling
- Network errors handled gracefully
- Invalid tokens trigger re-login
- API errors shown to user
- Credit errors show top-up options

## User Workflow

1. **First Time Setup**
   - User installs plugin
   - User clicks "Login" from menu
   - Enters email/password
   - Token saved automatically

2. **Rendering**
   - User positions camera
   - Clicks "Capture & Render"
   - Plugin checks authentication (auto-login if token valid)
   - Plugin checks credits
   - If sufficient, captures and renders
   - If insufficient, shows top-up dialog

3. **Credit Management**
   - User can view credits from menu
   - User can top-up from credits dialog
   - User can top-up from insufficient credits dialog

## Security Considerations

1. **Token Storage**: Tokens stored in SketchUp model (should be encrypted)
2. **Token Validation**: Tokens validated before each API call
3. **HTTPS Only**: All API calls use HTTPS
4. **No Password Storage**: Passwords never stored, only tokens

## Implementation Status

✅ **Completed:**
1. ✅ Created API endpoints under `/api/sketchup-extension/`
2. ✅ Implemented Bearer token authentication
3. ✅ Created credits endpoint
4. ✅ Created render endpoints (wraps main handler)
5. ✅ Updated plugin code to use new endpoints

## Next Steps

1. **Test Integration**: Test full authentication and credit flow
2. **Add Encryption**: Encrypt tokens in SketchUp model storage (optional enhancement)
3. **Error Handling**: Add more comprehensive error handling
4. **Rate Limiting**: Consider rate limiting for extension endpoints
5. **Documentation**: Update user documentation with new endpoints

