# QR Code Signup Flow

## Overview

The QR signup feature allows users to quickly sign up or log in by scanning a QR code on visiting cards. The flow is seamless - one scan, one signup.

## Route

**URL:** `/api/qr-signup`

## How It Works

1. **User scans QR code** → Lands on `/api/qr-signup`
2. **Route checks authentication:**
   - If user is already logged in → Redirects to `/dashboard`
   - If user is not logged in → Proceeds to step 3
3. **Redirects to Google OAuth** with account selector enabled
4. **User selects Google account** and authorizes
5. **OAuth callback** (`/auth/callback?next=/dashboard`):
   - Creates user session
   - Creates user profile (if new user)
   - Initializes user credits (10 free credits)
   - Creates welcome transaction
6. **Redirects to dashboard** (`/dashboard`)

## Features

- ✅ **Seamless signup** - No forms, just OAuth
- ✅ **Account selector** - Google account picker enabled
- ✅ **Works for existing users** - Logs in if account exists
- ✅ **Auto profile creation** - Profile created automatically
- ✅ **Welcome credits** - 10 free credits on signup
- ✅ **Smart redirects** - Already logged in users go straight to dashboard

## Usage

### Generate QR Code

1. Use your production URL: `https://yourdomain.com/api/qr-signup`
2. Generate QR code using any QR code generator
3. Add QR code to visiting cards, marketing materials, etc.

### Example QR Code Generators

- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)
- [Google Charts API](https://developers.google.com/chart/infographics/docs/qr_codes)

### Testing Locally

For local development, use: `http://localhost:3000/api/qr-signup`

## Technical Details

### Route Implementation

- **File:** `app/api/qr-signup/route.ts`
- **Method:** GET
- **Authentication:** Not required (public route)
- **OAuth Provider:** Google only

### Callback Flow

The callback route (`/auth/callback`) handles:
- Session creation
- User profile creation via `UserOnboardingService`
- Avatar generation (if not provided by OAuth)
- Credit initialization
- Welcome transaction creation

### Error Handling

- OAuth errors → Redirects to `/login` with error message
- Missing OAuth URL → Redirects to `/login` with error
- Unexpected errors → Redirects to `/login` with generic error

## Environment Variables

Ensure these are set:
- `NEXT_PUBLIC_SITE_URL` - Your production URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Security

- Route is public (no authentication required)
- OAuth flow handled securely by Supabase
- Session management via Supabase Auth
- CSRF protection via Supabase

## Future Enhancements

Potential improvements:
- Support for multiple OAuth providers (GitHub, etc.)
- Custom redirect destinations via query params
- Analytics tracking for QR code scans
- Custom welcome messages for QR signups



