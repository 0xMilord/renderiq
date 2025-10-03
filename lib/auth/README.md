# Authentication System Architecture

## Overview

This authentication system follows a clean architecture pattern with proper separation of concerns:

```
Components/Pages → Hooks → Actions → Services → DAL → Database
```

## Architecture Layers

### 1. **Components/Pages** (UI Layer)
- React components that use auth hooks
- Handle user interactions and display auth state
- Examples: `app/login/page.tsx`, `app/signup/page.tsx`

### 2. **Hooks** (Client-side State Management)
- `lib/hooks/use-auth.ts` - Client-side auth state management
- Provides auth methods to components
- Handles auth state changes and re-renders

### 3. **Actions** (Server Actions)
- `lib/actions/auth.actions.ts` - Server-side auth actions
- Bridge between client and server
- Handle redirects and server-side logic

### 4. **Services** (Business Logic)
- `lib/services/auth.ts` - Auth business logic
- `lib/services/user-onboarding.ts` - User profile management
- Validation, error handling, and business rules

### 5. **DAL** (Data Access Layer)
- `lib/dal/auth.ts` - Database operations
- Abstracted database queries
- Type-safe database interactions

### 6. **Database** (Data Layer)
- Supabase Auth for authentication
- PostgreSQL for user profiles and credits
- Proper schema with relationships

## Key Features

### ✅ **Complete Auth Flow**
- Email/password authentication
- OAuth (Google, GitHub)
- User profile creation and management
- Credit system integration

### ✅ **Proper Separation of Concerns**
- Each layer has a single responsibility
- No direct database access from components
- Clean interfaces between layers

### ✅ **Type Safety**
- Comprehensive TypeScript types
- Zod validation schemas
- Type-safe database operations

### ✅ **Error Handling**
- Consistent error patterns across all layers
- Proper error propagation
- User-friendly error messages

### ✅ **Security**
- Server-side validation
- Secure password handling
- OAuth integration
- Session management

## File Structure

```
lib/
├── auth/
│   └── README.md                 # This file
├── actions/
│   └── auth.actions.ts          # Server actions
├── dal/
│   └── auth.ts                  # Data access layer
├── hooks/
│   └── use-auth.ts              # Client-side auth hook
├── services/
│   ├── auth.ts                  # Auth business logic
│   └── user-onboarding.ts       # User profile management
├── supabase/
│   ├── client.ts                # Browser client
│   └── server.ts                # Server client
└── types/
    └── auth.ts                  # Auth type definitions
```

## Usage Examples

### Sign In
```typescript
// In a component
const { signIn } = useAuth();

const handleSignIn = async (email: string, password: string) => {
  const { error } = await signIn(email, password);
  if (error) {
    // Handle error
  }
  // Success - user will be redirected
};
```

### Sign Up
```typescript
// In a component
const { signUp } = useAuth();

const handleSignUp = async (email: string, password: string, name?: string) => {
  const { error } = await signUp(email, password, name);
  if (error) {
    // Handle error
  }
  // Success - user will be redirected
};
```

### OAuth Sign In
```typescript
// In a component
const { signInWithGoogle, signInWithGithub } = useAuth();

const handleGoogleSignIn = async () => {
  const { error } = await signInWithGoogle();
  if (error) {
    // Handle error
  }
  // Success - user will be redirected to OAuth provider
};
```

### Check Auth State
```typescript
// In a component
const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <div>Please sign in</div>;

return <div>Welcome, {user.email}!</div>;
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  email_verified BOOLEAN DEFAULT false NOT NULL,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### User Credits Table
```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  last_reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Credit Transactions Table
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'refund', 'bonus')) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT CHECK (reference_type IN ('render', 'subscription', 'bonus', 'refund')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Security Considerations

1. **Input Validation**: All inputs are validated using Zod schemas
2. **Server-side Auth**: All auth operations happen server-side
3. **Session Management**: Proper session handling with Supabase
4. **OAuth Security**: Secure OAuth flow with proper redirects
5. **Database Security**: Type-safe database operations

## Testing

Each layer can be tested independently:

- **Components**: Test user interactions and UI state
- **Hooks**: Test auth state management
- **Actions**: Test server-side logic
- **Services**: Test business logic and validation
- **DAL**: Test database operations

## Maintenance

- **Adding new auth methods**: Add to service → action → hook
- **Database changes**: Update schema → DAL → service
- **UI changes**: Update components and hooks
- **Validation changes**: Update Zod schemas in services

## Troubleshooting

### Common Issues

1. **Auth state not updating**: Check if `useAuth` hook is properly implemented
2. **OAuth redirects not working**: Verify callback URL configuration
3. **Database errors**: Check DAL implementation and schema
4. **Type errors**: Ensure all types are properly imported

### Debug Logging

All auth operations include comprehensive logging:
- `🔐 AuthService:` - Service layer operations
- `👤 UserOnboarding:` - User profile operations
- `🔍 AuthDAL:` - Database operations
- `🔄 Auth Callback:` - OAuth callback operations
