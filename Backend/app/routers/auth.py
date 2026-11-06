"""
app/routers/auth.py
─────────────────────────────────────────────
Endpoints:
    POST /auth/signup  — Register a new user (public)
    POST /auth/login   — Login and receive JWT (public)
"""

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.database import get_session
from app.schemas.user import UserSignupRequest, UserLoginRequest
from app.schemas.token import TokenResponse
from app.services import auth_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Creates a new user account. "
        "A bank account is automatically generated with account number starting from ACC100001. "
        "Initial balance is ₹0."
    ),
)
def signup(
    body: UserSignupRequest,
    session: Session = Depends(get_session),
):
    """
    **Public endpoint** — No token required.

    Request body:
    - `full_name`: User's full name
    - `email`: Unique email address
    - `phone_number`: Valid Indian mobile number
    - `password`: Minimum 8 characters
    - `role`: USER (default) or ADMIN
    """
    result = auth_service.signup(session, body)
    return success_response(
        data=result,
        message="User registered successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT token",
    description="Validates credentials and returns a Bearer JWT token for authenticated requests.",
)
def login(
    body: UserLoginRequest,
    session: Session = Depends(get_session),
):
    """
    **Public endpoint** — No token required.

    Request body:
    - `email`: Registered email
    - `password`: Account password

    Returns a `TokenResponse` with `access_token` and `token_type`.
    Use the token in the `Authorization: Bearer <token>` header for all protected routes.
    """
    token = auth_service.login(session, body)
    return token
