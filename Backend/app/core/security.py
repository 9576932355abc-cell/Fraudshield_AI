

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config.settings import settings
from app.models.enums import UserRole
from app.schemas.token import TokenData

# ── Password Hashing ──────────────────────────────────────────────────────
# bcrypt is intentionally slow to resist brute-force attacks.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    Args:
        plain_password: The raw password from the signup form.

    Returns:
        A bcrypt hash string safe to store in the database.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.

    Args:
        plain_password: Password the user submitted at login.
        hashed_password: Hash retrieved from the database.

    Returns:
        True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT ───────────────────────────────────────────────────────────────────

def create_access_token(
    user_id: int,
    email: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Payload:
        sub   — subject (user's email)
        uid   — user_id
        role  — UserRole enum value
        exp   — expiry timestamp

    Args:
        user_id: Primary key of the authenticated user.
        email: User's email (used as JWT subject).
        role: User's role for RBAC checks.
        expires_delta: Custom TTL; falls back to settings value.

    Returns:
        Encoded JWT string.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": email,
        "uid": user_id,
        "role": role.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> TokenData:
    """
    Decode and validate a JWT access token.

    Args:
        token: Raw JWT string from the Authorization header.

    Returns:
        TokenData with user_id, email, and role.

    Raises:
        JWTError: If the token is invalid, tampered, or expired.
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )

    email: Optional[str] = payload.get("sub")
    user_id: Optional[int] = payload.get("uid")
    role_str: Optional[str] = payload.get("role")

    if email is None or user_id is None:
        raise JWTError("Token payload is missing required fields")

    role = UserRole(role_str) if role_str else None

    return TokenData(user_id=user_id, email=email, role=role)
