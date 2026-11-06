"""
app/core/dependencies.py
─────────────────────────────────────────────
Purpose:
    FastAPI dependency functions for authentication and authorization.
    Inject these into route handlers to protect endpoints.

    Usage in a router:
        @router.get("/protected")
        def protected(current_user: User = Depends(get_current_user)):
            ...

        @router.get("/admin-only")
        def admin_route(current_user: User = Depends(require_admin)):
            ...
"""

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlmodel import Session

from app.core.security import decode_access_token
from app.database import get_session
from app.models.user import User
from app.models.enums import UserRole
from app.utils.exceptions import (
    UnauthorizedError,
    ForbiddenError,
    TokenExpiredError,
    UserBlockedError,
)

# ── Bearer token extractor ────────────────────────────────────────────────
# auto_error=False lets us provide a cleaner error message ourselves.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    """
    Extract and validate the Bearer JWT from the Authorization header.
    Returns the authenticated User ORM object.

    Raises:
        UnauthorizedError: If token is missing or malformed.
        TokenExpiredError: If token has expired.
        UserBlockedError: If the user's account has been blocked.
    """
    if credentials is None:
        raise UnauthorizedError(detail="Authorization header missing")

    try:
        token_data = decode_access_token(credentials.credentials)
    except JWTError as exc:
        # Check for expiry message from jose
        if "expired" in str(exc).lower():
            raise TokenExpiredError()
        raise UnauthorizedError(detail="Invalid or malformed token")

    # Load fresh user from DB (catches deleted users mid-session)
    user = session.get(User, token_data.user_id)
    if user is None:
        raise UnauthorizedError(detail="User associated with this token no longer exists")

    if not user.is_active:
        raise UserBlockedError()

    return user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Extends get_current_user — additionally enforces ADMIN role.

    Raises:
        ForbiddenError: If the authenticated user is not an ADMIN.
    """
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenError(detail="Admin access required")
    return current_user
