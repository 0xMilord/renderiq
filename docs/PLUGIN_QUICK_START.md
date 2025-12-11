# Plugin API - Quick Start Guide

## 5-Minute Setup

### 1. Authenticate

```http
POST https://renderiq.io/api/plugins/auth/signin
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_at": "2025-01-01T13:00:00Z",
  "user": {
    "id": "uuid",
    "email": "your@email.com"
  }
}
```

### 2. Store Token

Save `access_token` securely in your plugin settings.

### 3. Create Render

```http
POST https://renderiq.io/api/plugins/renders
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

uploadedImageData: <base64-encoded-image>
uploadedImageType: image/png
quality: high
aspectRatio: 16:9
style: photorealistic
prompt: Your render description (optional)
callback_url: https://your-server.com/webhook (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "processing",
    "creditsCost": 10,
    "estimatedTime": 30
  }
}
```

### 4. Webhooks (Recommended)

Instead of polling, register a webhook to receive notifications when renders complete:

#### Register Webhook

```http
POST https://renderiq.io/api/plugins/webhooks/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["render.completed", "render.failed"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "url": "https://your-server.com/webhook",
    "secret": "whsec_...",
    "events": ["render.completed", "render.failed"]
  }
}
```

Save the `secret` for signature verification.

#### Using callback_url (Simpler)

You can also provide a `callback_url` when creating a render. This automatically creates a temporary webhook:

```http
POST https://renderiq.io/api/plugins/renders
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

uploadedImageData: <image>
callback_url: https://your-server.com/webhook
...
```

#### Webhook Payload

When a render completes, you'll receive a POST request:

```json
{
  "event": "render.completed",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "renderId": "uuid",
    "status": "completed",
    "outputUrl": "https://cdn.renderiq.io/.../render.png",
    "creditsUsed": 10
  }
}
```

**Headers:**
- `X-Renderiq-Signature`: HMAC-SHA256 signature (verify with your webhook secret)
- `X-Renderiq-Event`: Event type (`render.completed` or `render.failed`)

#### Verify Webhook Signature

```python
import hmac
import hashlib

def verify_webhook(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

### 5. Get Status (Polling - Alternative to Webhooks)

```http
GET https://renderiq.io/api/plugins/renders/<renderId>
Authorization: Bearer <access_token>
```

**Response (Processing):**
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "processing",
    "progress": 60,
    "estimatedTimeRemaining": 15
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "renderId": "uuid",
    "status": "completed",
    "outputUrl": "https://cdn.renderiq.io/.../render.png",
    "creditsUsed": 10
  }
}
```

---

## Optional: Use API Keys

### Create API Key

```http
POST https://renderiq.io/api/plugins/keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Plugin",
  "scopes": ["renders:create", "renders:read"],
  "expiresAt": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "rk_live_xxxxxxxxxxxx",  // Save this! Only shown once
    "scopes": ["renders:create", "renders:read"]
  }
}
```

### Use API Key

Replace `Authorization: Bearer <token>` with:
```
X-Api-Key: rk_live_xxxxxxxxxxxx
```

---

## Optional: Register Webhook

### Register

```http
POST https://renderiq.io/api/plugins/webhooks/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["render.completed", "render.failed"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhookId": "uuid",
    "secret": "xxxxxxxxxxxx",  // Use this to verify HMAC signature
    "url": "https://your-server.com/webhook",
    "events": ["render.completed", "render.failed"]
  }
}
```

### Verify Webhook Signature

```typescript
import crypto from 'crypto';

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook endpoint
const signature = request.headers.get('X-Renderiq-Signature');
const body = await request.text();

if (!verifyWebhook(body, signature, secret)) {
  return new Response('Invalid signature', { status: 401 });
}
```

### Webhook Payload

```json
{
  "event": "render.completed",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "renderId": "uuid",
    "status": "completed",
    "outputUrl": "https://cdn.renderiq.io/.../render.png"
  },
  "signature": "hmac-sha256-signature"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable message",
  "errorCode": "ERROR_CODE"
}
```

**Common Error Codes:**
- `AUTH_REQUIRED` - Missing/invalid token
- `INSUFFICIENT_CREDITS` - Not enough credits
- `INVALID_INPUT` - Invalid parameters
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `RENDER_FAILED` - AI generation failed

---

## Platform Detection

Include platform in User-Agent header:

```
User-Agent: Renderiq-Plugin/SketchUp/1.0.0
```

Or use explicit header:

```
X-Renderiq-Platform: sketchup
```

---

## Full API Reference

See `docs/PLUGIN_API_OPENAPI.yaml` for complete OpenAPI specification.

---

**Questions?** Check `docs/PLUGIN_INFRASTRUCTURE.md` for detailed documentation.

