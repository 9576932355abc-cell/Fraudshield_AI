"""
app/schemas/token.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for JWT token request and response payloads.
"""

from typing import Optional
from pydantic import BaseModel

from app.models.enums import UserRole


class TokenResponse(BaseModel):
    """Returned to the client after a successful login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int              # seconds until expiry


class TokenData(BaseModel):
    """
    Decoded JWT payload. Stored inside the token.
    Used by dependencies to identify the current user.
    """
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
