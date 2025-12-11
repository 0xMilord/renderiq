# API Keys Architecture & Security

## Overview

API key management follows the Renderiq internal architecture pattern:
- **Dashboard/Internal App**: Uses Server Actions + React Hooks (NOT API routes)
- **External Plugins**: Uses API routes (`/api/plugins/keys/*`)

---

## Architecture Pattern

### Internal App (Dashboard) Flow

```
┌─────────────┐
│   Dashboard │
│    (UI)     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  React Hook         │
│  useApiKeys()       │
│  lib/hooks/         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Server Action      │
│  createApiKeyAction │
│  lib/actions/       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Data Access Layer  │
│  ApiKeysDAL         │
│  lib/dal/           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Database           │
│  plugin_api_keys    │
└─────────────────────┘
```

### External Plugin Flow

```
┌─────────────┐
│   Plugin    │
│ (SketchUp,  │
│  Revit, etc)│
└──────┬──────┘
       │
       │ HTTPS + Bearer Token
       ▼
┌─────────────────────┐
│  API Route          │
│  /api/plugins/keys  │
│  app/api/plugins/   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Data Access Layer  │
│  ApiKeysDAL         │
│  lib/dal/           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Database           │
│  plugin_api_keys    │
└─────────────────────┘
```

---

## Security: Encryption at Rest & in Transit

### At Rest (Database Storage)

**Current Implementation**: ✅ **Secure**

- **Hashing**: API keys are hashed using SHA-256 before storage
- **One-way**: Keys cannot be recovered from hash (one-way function)
- **Storage**: Only hashed key stored in database (`plugin_api_keys.key`)
- **Prefix**: Key prefix stored for display (`rk_live_xxxx`)

```typescript
// lib/dal/api-keys.ts
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Keys are hashed before storage
const hashedKey = hashApiKey(plainKey);
await db.insert(pluginApiKeys).values({ key: hashedKey, ... });
```

**Security Properties**:
- ✅ **One-way hashing**: SHA-256 is cryptographically secure
- ✅ **Timing-safe comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks
- ✅ **No plaintext storage**: Plain keys never stored in database
- ✅ **Plain key shown once**: Only returned on creation, never again

### In Transit (Network)

**Current Implementation**: ✅ **Secure**

- **HTTPS/TLS**: All API communication uses HTTPS (TLS 1.3/SSL)
- **Bearer Tokens**: Authentication via secure JWT tokens
- **No key transmission**: Keys only transmitted once (on creation) over HTTPS

**Security Properties**:
- ✅ **TLS encryption**: All traffic encrypted in transit
- ✅ **Secure headers**: Proper security headers set
- ✅ **No key logging**: Keys are redacted from logs

---

## Usage

### Dashboard/Internal App

**Server Actions** (`lib/actions/api-keys.actions.ts`):
```typescript
import { createApiKeyAction, listApiKeysAction, revokeApiKeyAction } from '@/lib/actions/api-keys.actions';

// Create API key
const result = await createApiKeyAction({
  name: 'My Plugin',
  scopes: ['renders:create', 'renders:read'],
  expiresAt: null, // Optional
});

// List API keys
const keys = await listApiKeysAction();

// Revoke API key
await revokeApiKeyAction(keyId);
```

**React Hook** (`lib/hooks/use-api-keys.ts`):
```typescript
'use client';

import { useApiKeys } from '@/lib/hooks/use-api-keys';

function ApiKeysPage() {
  const { keys, loading, error, createKey, revokeKey, refetch } = useApiKeys();

  const handleCreate = async () => {
    const result = await createKey({
      name: 'My Plugin',
      scopes: ['renders:create'],
    });
    
    if (result.success && result.data) {
      // result.data.key contains the plain key (only shown once)
      console.log('API Key:', result.data.key);
    }
  };

  return (
    <div>
      {keys.map(key => (
        <div key={key.id}>
          {key.keyPrefix} - {key.name}
          <button onClick={() => revokeKey(key.id)}>Revoke</button>
        </div>
      ))}
    </div>
  );
}
```

### External Plugins

**API Routes** (`/api/plugins/keys/*`):
```http
# Create API key
POST https://renderiq.io/api/plugins/keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Plugin",
  "scopes": ["renders:create", "renders:read"],
  "expiresAt": null
}

# List API keys
GET https://renderiq.io/api/plugins/keys
Authorization: Bearer <access_token>

# Revoke API key
DELETE https://renderiq.io/api/plugins/keys/{keyId}
Authorization: Bearer <access_token>
```

---

## Audit Logging

All API key operations are logged for security auditing:

**Security Logs** (`lib/utils/security.ts`):
- `api_key_created` - When a key is created
- `api_key_revoked` - When a key is revoked
- `api_key_create_unauthorized` - Unauthorized creation attempt
- `api_key_revoke_unauthorized` - Unauthorized revocation attempt
- `api_key_create_error` - Creation error
- `api_key_revoke_error` - Revocation error

**Log Fields**:
- `keyId` - API key ID
- `keyPrefix` - Key prefix (masked)
- `scopes` - Key scopes
- `userId` - User who created/revoked
- `error` - Error message (if any)

---

## Key Format

**Format**: `rk_live_<32-char-hex>`

**Example**: `rk_live_example_32_char_placeholder_value`

**Components**:
- `rk_live_` - Prefix (identifies as Renderiq API key)
- `<32-char-hex>` - 32 hexadecimal characters (128 bits of entropy)

**Security**:
- ✅ **High entropy**: 128 bits of random data
- ✅ **Cryptographically secure**: Uses `crypto.randomBytes()`
- ✅ **Unpredictable**: Cannot be guessed or brute-forced

---

## Scope System

**Valid Scopes**:
- `renders:create` - Create render requests
- `renders:read` - Read render status
- `projects:read` - Read projects
- `webhook:write` - Register webhooks

**Scope Validation**:
- Scopes validated on creation
- Invalid scopes rejected
- Scope checking on API key use

---

## Best Practices

### For Dashboard Developers

1. **Always use Server Actions** - Never call API routes from dashboard
2. **Use React Hooks** - Use `useApiKeys()` hook for UI state management
3. **Never log keys** - Keys are automatically redacted from logs
4. **Show key once** - Display plain key only on creation, then mask

### For Plugin Developers

1. **Store keys securely** - Use platform-specific secure storage
2. **Never log keys** - Don't log API keys in plugin code
3. **Use HTTPS** - Always use HTTPS for API calls
4. **Handle errors** - Properly handle authentication errors

---

## Migration Notes

**If migrating from API routes to Server Actions**:

1. Replace API calls with Server Actions:
   ```typescript
   // ❌ Old (API route)
   const response = await fetch('/api/plugins/keys', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: JSON.stringify({ name, scopes }),
   });

   // ✅ New (Server Action)
   const result = await createApiKeyAction({ name, scopes });
   ```

2. Use React Hooks for UI:
   ```typescript
   // ❌ Old (Manual state management)
   const [keys, setKeys] = useState([]);
   useEffect(() => {
     fetch('/api/plugins/keys').then(r => r.json()).then(setKeys);
   }, []);

   // ✅ New (React Hook)
   const { keys, loading, error, refetch } = useApiKeys();
   ```

---

## Security Checklist

- [x] Keys hashed with SHA-256 before storage
- [x] Plain keys never stored in database
- [x] Plain keys only shown once (on creation)
- [x] Timing-safe comparison for key verification
- [x] HTTPS/TLS for all network communication
- [x] Security logging for all operations
- [x] Scope validation on creation
- [x] Key expiration support
- [x] Key revocation support
- [x] Audit trail for all operations

---

**Last Updated**: 2025-01-27  
**Architecture Pattern**: Server Actions + React Hooks (Internal) | API Routes (External Plugins)

