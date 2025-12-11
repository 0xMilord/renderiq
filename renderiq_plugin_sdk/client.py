"""
Renderiq Plugin API Client
Main client class for interacting with Renderiq Plugin API
"""

import requests
import json
from typing import Optional, Dict, Any, List, BinaryIO
from urllib.parse import urljoin
import hashlib
import hmac

from .exceptions import (
    RenderiqError,
    AuthenticationError,
    APIError,
    NetworkError,
    ValidationError,
)


class RenderiqClient:
    """Client for Renderiq Plugin API"""
    
    def __init__(
        self,
        base_url: str = "https://renderiq.io",
        access_token: Optional[str] = None,
        api_key: Optional[str] = None,
        platform: str = "python",
        plugin_version: Optional[str] = None,
    ):
        """
        Initialize Renderiq client
        
        Args:
            base_url: Base URL for Renderiq API (default: https://renderiq.io)
            access_token: Bearer token for authentication
            api_key: API key for authentication (alternative to access_token)
            platform: Platform identifier (default: "python")
            plugin_version: Plugin version string (optional)
        """
        if not access_token and not api_key:
            raise ValidationError("Either access_token or api_key must be provided")
        
        self.base_url = base_url.rstrip('/')
        self.api_base = f"{self.base_url}/api/plugins"
        self.access_token = access_token
        self.api_key = api_key
        self.platform = platform
        self.plugin_version = plugin_version
        
        self.session = requests.Session()
        self._set_headers()
    
    def _set_headers(self):
        """Set default headers for requests"""
        headers = {
            "Content-Type": "application/json",
            "X-Renderiq-Platform": self.platform,
        }
        
        if self.plugin_version:
            headers["X-Renderiq-Plugin-Version"] = self.plugin_version
        
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["X-Api-Key"] = self.api_key
        
        self.session.headers.update(headers)
    
    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (relative to /api/plugins)
            data: Request body data (will be JSON-encoded)
            files: Files to upload (for multipart/form-data)
            params: Query parameters
        
        Returns:
            Response JSON data
        
        Raises:
            NetworkError: If network request fails
            APIError: If API returns error response
        """
        url = urljoin(self.api_base + "/", endpoint.lstrip("/"))
        
        try:
            # Remove Content-Type for file uploads
            headers = dict(self.session.headers)
            if files:
                headers.pop("Content-Type", None)
            
            response = self.session.request(
                method=method,
                url=url,
                json=data if not files else None,
                data=data if files else None,
                files=files,
                params=params,
                timeout=300,  # 5 minutes for large uploads
            )
            
            # Check rate limit headers
            rate_limit_remaining = response.headers.get("X-RateLimit-Remaining")
            rate_limit_reset = response.headers.get("X-RateLimit-Reset")
            
            if rate_limit_remaining:
                print(f"Rate limit: {rate_limit_remaining} requests remaining")
            
            # Parse response
            try:
                response_data = response.json()
            except ValueError:
                response_data = {"success": False, "error": "Invalid JSON response"}
            
            # Check for errors
            if not response.ok:
                error_msg = response_data.get("error", f"API error: {response.status_code}")
                error_code = response_data.get("errorCode")
                details = response_data.get("details", {})
                
                if response.status_code == 401:
                    raise AuthenticationError(error_msg)
                elif response.status_code == 429:
                    retry_after = response.headers.get("Retry-After", "60")
                    raise APIError(
                        f"Rate limit exceeded. Retry after {retry_after} seconds",
                        status_code=429,
                        error_code=error_code,
                        details=details,
                    )
                else:
                    raise APIError(
                        error_msg,
                        status_code=response.status_code,
                        error_code=error_code,
                        details=details,
                    )
            
            return response_data
        
        except requests.exceptions.RequestException as e:
            raise NetworkError(f"Network error: {str(e)}")
        except (AuthenticationError, APIError):
            raise
        except Exception as e:
            raise RenderiqError(f"Unexpected error: {str(e)}")
    
    def signin(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in and get access token
        
        Args:
            email: User email
            password: User password
        
        Returns:
            Dictionary with access_token, refresh_token, expires_at, and user info
        
        Raises:
            AuthenticationError: If sign in fails
        """
        data = {"email": email, "password": password}
        response = self._request("POST", "/auth/signin", data=data)
        
        if response.get("success"):
            # Update access token
            self.access_token = response.get("access_token")
            self._set_headers()
            
            return response
        else:
            raise AuthenticationError(response.get("error", "Sign in failed"))
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token
        
        Args:
            refresh_token: Refresh token from previous signin
        
        Returns:
            Dictionary with new access_token and refresh_token
        
        Raises:
            AuthenticationError: If refresh fails
        """
        data = {"refresh_token": refresh_token}
        response = self._request("POST", "/auth/refresh", data=data)
        
        if response.get("success"):
            # Update access token
            self.access_token = response.get("access_token")
            self._set_headers()
            
            return response
        else:
            raise AuthenticationError(response.get("error", "Token refresh failed"))
    
    def get_user_info(self) -> Dict[str, Any]:
        """
        Get current user information
        
        Returns:
            Dictionary with user info and credits
        """
        response = self._request("GET", "/auth/me")
        return response.get("user") if response.get("success") else None
    
    def get_credits(self) -> Dict[str, Any]:
        """
        Get user credit balance
        
        Returns:
            Dictionary with balance, totalEarned, totalSpent
        """
        response = self._request("GET", "/credits")
        return response.get("data") if response.get("success") else None
    
    def create_render(
        self,
        image_data: Optional[bytes] = None,
        image_file: Optional[BinaryIO] = None,
        image_url: Optional[str] = None,
        prompt: Optional[str] = None,
        quality: str = "high",
        aspect_ratio: str = "16:9",
        style: str = "photorealistic",
        project_id: Optional[str] = None,
        callback_url: Optional[str] = None,
        use_resumable: bool = False,
        chunk_size: int = 10 * 1024 * 1024,  # 10MB chunks
    ) -> Dict[str, Any]:
        """
        Create a render request
        
        Args:
            image_data: Image data as bytes
            image_file: Image file object (file-like)
            image_url: Image URL (alternative to image_data/image_file)
            prompt: Render prompt/description
            quality: Render quality (standard, high, ultra)
            aspect_ratio: Aspect ratio (e.g., "16:9", "4:3")
            style: Render style (e.g., "photorealistic", "dramatic")
            project_id: Optional project ID
            callback_url: Optional webhook callback URL
            use_resumable: Use resumable upload for large files (recommended for >50MB)
            chunk_size: Chunk size for resumable uploads (default: 10MB)
        
        Returns:
            Dictionary with renderId and status
        
        Raises:
            ValidationError: If no image provided
            APIError: If render creation fails
        """
        if not image_data and not image_file and not image_url:
            raise ValidationError("Must provide image_data, image_file, or image_url")
        
        # Prepare form data
        files = {}
        data = {
            "quality": quality,
            "aspectRatio": aspect_ratio,
            "style": style,
            "type": "image",
        }
        
        if prompt:
            data["prompt"] = prompt
        if project_id:
            data["projectId"] = project_id
        if callback_url:
            data["callback_url"] = callback_url
        
        # Handle image
        if image_url:
            data["imageUrl"] = image_url
        elif image_data or image_file:
            # Use resumable upload for large files
            if use_resumable:
                image_bytes = image_data if image_data else image_file.read()
                return self._create_render_resumable(
                    image_bytes=image_bytes,
                    content_type="image/png",
                    **data,
                    chunk_size=chunk_size,
                )
            else:
                # Regular multipart upload
                if image_data:
                    files["uploadedImageData"] = ("image.png", image_data, "image/png")
                else:
                    files["uploadedImageData"] = image_file
                data["uploadedImageType"] = "image/png"
        
        response = self._request("POST", "/renders", data=data, files=files if files else None)
        return response.get("data") if response.get("success") else None
    
    def _create_render_resumable(
        self,
        image_bytes: bytes,
        content_type: str,
        chunk_size: int = 10 * 1024 * 1024,
        **render_params,
    ) -> Dict[str, Any]:
        """
        Create render using resumable upload (internal helper)
        
        Args:
            image_bytes: Image bytes
            content_type: Image content type
            chunk_size: Chunk size for upload
            **render_params: Render parameters
        
        Returns:
            Dictionary with renderId and status
        """
        # Initialize resumable upload
        init_data = {
            "fileName": "render_image.png",
            "contentType": content_type,
            "totalSize": len(image_bytes),
        }
        
        init_response = self._request("POST", "/uploads/resumable/init", data=init_data)
        
        if not init_response.get("success"):
            raise APIError("Failed to initialize resumable upload")
        
        session_data = init_response.get("data")
        upload_url = session_data["uploadUrl"]
        session_id = session_data["sessionId"]
        
        # Upload in chunks
        uploaded_bytes = 0
        total_size = len(image_bytes)
        
        while uploaded_bytes < total_size:
            chunk_end = min(uploaded_bytes + chunk_size, total_size)
            chunk = image_bytes[uploaded_bytes:chunk_end]
            
            # Upload chunk to GCS
            headers = {
                "Content-Length": str(len(chunk)),
                "Content-Range": f"bytes {uploaded_bytes}-{chunk_end - 1}/{total_size}",
            }
            
            try:
                response = requests.put(
                    upload_url,
                    data=chunk,
                    headers=headers,
                    timeout=300,
                )
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                raise NetworkError(f"Failed to upload chunk: {str(e)}")
            
            uploaded_bytes = chunk_end
            
            # Update progress (optional)
            progress = (uploaded_bytes / total_size) * 100
            print(f"Upload progress: {progress:.1f}%")
        
        # Finalize upload
        finalize_response = self._request(
            "POST",
            f"/uploads/resumable/{session_id}/finalize",
        )
        
        if not finalize_response.get("success"):
            raise APIError("Failed to finalize upload")
        
        upload_result = finalize_response.get("data")
        image_url = upload_result["url"]
        
        # Create render with uploaded image URL
        render_data = {
            **render_params,
            "imageUrl": image_url,
        }
        
        render_response = self._request("POST", "/renders", data=render_data)
        return render_response.get("data") if render_response.get("success") else None
    
    def get_render_status(self, render_id: str) -> Dict[str, Any]:
        """
        Get render status
        
        Args:
            render_id: Render ID
        
        Returns:
            Dictionary with render status, outputUrl, progress, etc.
        """
        response = self._request("GET", f"/renders/{render_id}")
        return response.get("data") if response.get("success") else None
    
    def register_webhook(
        self,
        url: str,
        events: List[str],
        secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Register a webhook
        
        Args:
            url: Webhook URL (must be HTTPS)
            events: List of events to subscribe to (e.g., ["render.completed", "render.failed"])
            secret: Optional secret for HMAC verification (auto-generated if not provided)
        
        Returns:
            Dictionary with webhook ID and secret
        """
        data = {
            "url": url,
            "events": events,
        }
        
        if secret:
            data["secret"] = secret
        
        response = self._request("POST", "/webhooks/register", data=data)
        return response.get("data") if response.get("success") else None
    
    def verify_webhook_signature(
        self,
        payload: str,
        signature: str,
        secret: str,
    ) -> bool:
        """
        Verify webhook HMAC signature
        
        Args:
            payload: Webhook payload (raw request body as string)
            signature: Signature from X-Renderiq-Signature header
            secret: Webhook secret
        
        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    def list_projects(
        self,
        limit: int = 50,
        offset: int = 0,
        platform: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List user projects
        
        Args:
            limit: Number of projects to return
            offset: Pagination offset
            platform: Optional platform filter
        
        Returns:
            Dictionary with projects list and pagination info
        """
        params = {"limit": limit, "offset": offset}
        if platform:
            params["platform"] = platform
        
        response = self._request("GET", "/projects", params=params)
        return response.get("data") if response.get("success") else None
    
    def get_project(self, project_id: str) -> Dict[str, Any]:
        """
        Get project details
        
        Args:
            project_id: Project ID
        
        Returns:
            Dictionary with project details
        """
        response = self._request("GET", f"/projects/{project_id}")
        return response.get("data") if response.get("success") else None
    
    def create_project(
        self,
        name: str,
        description: Optional[str] = None,
        image_file: Optional[BinaryIO] = None,
    ) -> Dict[str, Any]:
        """
        Create a project
        
        Args:
            name: Project name
            description: Optional project description
            image_file: Optional project image file
        
        Returns:
            Dictionary with project ID and details
        """
        data = {"name": name}
        if description:
            data["description"] = description
        
        files = {}
        if image_file:
            files["image"] = image_file
        
        response = self._request("POST", "/projects", data=data, files=files if files else None)
        return response.get("data") if response.get("success") else None

