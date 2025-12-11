"""Exception classes for Renderiq Plugin SDK"""


class RenderiqError(Exception):
    """Base exception for all Renderiq SDK errors"""
    pass


class AuthenticationError(RenderiqError):
    """Raised when authentication fails"""
    pass


class APIError(RenderiqError):
    """Raised when API returns an error response"""
    def __init__(self, message: str, status_code: int = None, error_code: str = None, details: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class NetworkError(RenderiqError):
    """Raised when network request fails"""
    pass


class ValidationError(RenderiqError):
    """Raised when input validation fails"""
    pass

