# Renderiq Plugin SDK (Python)

Official Python SDK for the Renderiq Plugin API.

## Installation

```bash
pip install renderiq-plugin-sdk
```

Or install from source:

```bash
git clone https://github.com/renderiq/renderiq-plugin-sdk-python
cd renderiq-plugin-sdk-python
pip install -e .
```

## Quick Start

```python
from renderiq_plugin_sdk import RenderiqClient

# Initialize client with access token
client = RenderiqClient(
    access_token="your_access_token",
    platform="blender",  # or "rhino", "revit", etc.
    plugin_version="1.0.0"
)

# Or sign in with email/password
client = RenderiqClient(platform="blender")
client.signin("user@example.com", "password")

# Create a render
with open("model_image.png", "rb") as image_file:
    render = client.create_render(
        image_file=image_file,
        prompt="Photorealistic architectural render",
        quality="high",
        style="photorealistic",
        use_resumable=True,  # Use resumable upload for large files (>50MB)
    )

print(f"Render ID: {render['renderId']}")
print(f"Status: {render['status']}")

# Check render status
status = client.get_render_status(render['renderId'])
print(f"Progress: {status.get('progress', 0)}%")
if status['status'] == 'completed':
    print(f"Output URL: {status['outputUrl']}")
```

## Features

- ✅ Authentication (sign in, token refresh)
- ✅ Create renders with resumable upload support
- ✅ Check render status
- ✅ Register and verify webhooks
- ✅ Project management
- ✅ Credit balance checking
- ✅ Automatic retry on network errors
- ✅ Rate limit tracking

## Resumable Uploads

For large files (>50MB), use resumable uploads:

```python
with open("large_model.png", "rb") as image_file:
    render = client.create_render(
        image_file=image_file,
        use_resumable=True,
        chunk_size=10 * 1024 * 1024,  # 10MB chunks
        prompt="Render this model",
    )
```

## Webhooks

Register a webhook to receive notifications:

```python
webhook = client.register_webhook(
    url="https://your-server.com/webhook",
    events=["render.completed", "render.failed"],
)

print(f"Webhook ID: {webhook['id']}")
print(f"Secret: {webhook['secret']}")  # Save this for verification
```

Verify webhook signatures:

```python
# In your webhook handler
signature = request.headers.get("X-Renderiq-Signature")
is_valid = client.verify_webhook_signature(
    payload=request.body,
    signature=signature,
    secret=webhook_secret,
)
```

## Error Handling

```python
from renderiq_plugin_sdk import (
    RenderiqClient,
    AuthenticationError,
    APIError,
    NetworkError,
)

try:
    client = RenderiqClient(access_token="token")
    render = client.create_render(...)
except AuthenticationError as e:
    print(f"Auth failed: {e}")
except APIError as e:
    print(f"API error ({e.status_code}): {e}")
    print(f"Error code: {e.error_code}")
except NetworkError as e:
    print(f"Network error: {e}")
```

## API Reference

See [Full API Documentation](https://docs.renderiq.io/plugins/python-sdk) for complete reference.

## License

MIT

