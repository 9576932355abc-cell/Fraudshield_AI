"""
app/services/auth_service.py
─────────────────────────────────────────────
Purpose:
    Business logic for user registration and login.

    Signup Flow:
        1. Validate email/phone uniqueness
        2. Hash password
        3. Create User in DB
        4. Trigger account_service to create a bank account
        5. Return user + account details

    Login Flow:
        1. Lookup user by email
        2. Verify password hash
        3. Check account is active (not blocked)
        4. Generate and return JWT
"""

from sqlmodel import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.config.settings import settings
from app.models.user import User
from app.repositories import user_repo
from app.schemas.user import UserSignupRequest, UserLoginRequest
from app.schemas.token import TokenResponse
from app.services import account_service
from app.utils.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserBlockedError,
)


def signup(session: Session, data: UserSignupRequest) -> dict:
    """
    Register a new user and automatically create their bank account.

    Args:
        session: DB session.
        data: Validated signup payload.

    Returns:
        Dict containing user details and the new account number.

    Raises:
        UserAlreadyExistsError: If email or phone already registered.
    """
    # ── Uniqueness checks ─────────────────────────────────────────────────
    if user_repo.get_user_by_email(session, data.email):
        raise UserAlreadyExistsError(field="email")

    if user_repo.get_user_by_phone(session, data.phone_number):
        raise UserAlreadyExistsError(field="phone number")

    # ── Create user ───────────────────────────────────────────────────────
    new_user = User(
        full_name=data.full_name,
        email=data.email,
        phone_number=data.phone_number,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    created_user = user_repo.create_user(session, new_user)

    # ── Auto-create bank account ──────────────────────────────────────────
    account = account_service.create_account_for_user(session, created_user.user_id)

    return {
        "user_id": created_user.user_id,
        "full_name": created_user.full_name,
        "email": created_user.email,
        "phone_number": created_user.phone_number,
        "role": created_user.role.value,
        "account_number": account.account_number,
        "account_type": account.account_type.value,
        "balance": str(account.balance),
        "message": "Registration successful. Your account has been created.",
    }


def login(session: Session, data: UserLoginRequest) -> TokenResponse:
    """
    Authenticate a user and issue a JWT.

    Args:
        session: DB session.
        data: Login credentials (email + password).

    Returns:
        TokenResponse with access_token.

    Raises:
        InvalidCredentialsError: Email not found or password mismatch.
        UserBlockedError: Account is inactive/blocked.
    """
    user = user_repo.get_user_by_email(session, data.email)

    # Use same error for both "not found" and "wrong password" to prevent
    # user enumeration attacks.
    if user is None or not verify_password(data.password, user.password_hash):
        raise InvalidCredentialsError()

    if not user.is_active:
        raise UserBlockedError()

    token = create_access_token(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
