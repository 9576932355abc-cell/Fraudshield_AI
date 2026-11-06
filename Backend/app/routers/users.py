"""
app/routers/users.py
─────────────────────────────────────────────
Endpoints:
    GET    /users/me               — Get own profile (USER)
    PATCH  /users/me               — Update own profile (USER)
    GET    /admin/users            — List all users (ADMIN)
    PATCH  /admin/users/{id}/block — Block a user (ADMIN)
    PATCH  /admin/users/{id}/unblock — Unblock a user (ADMIN)
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.dependencies import get_current_user, require_admin
from app.database import get_session
from app.models.user import User
from app.repositories import user_repo, account_repo
from app.schemas.user import UserResponse, UserUpdateRequest, UserListResponse
from app.services import audit_service
from app.models.enums import AuditActionType
from app.utils.exceptions import NotFoundError
from app.utils.response import success_response

router = APIRouter(tags=["Users"])


def enrich_user_response(session: Session, user: User) -> dict:
    """Enrich user with account_number if available."""
    account = account_repo.get_account_by_user_id(session, user.user_id)
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "account_number": account.account_number if account else None
    }


# ── User: Own Profile ─────────────────────────────────────────────────────

@router.get(
    "/users/me",
    response_model=UserResponse,
    summary="Get my profile",
)
def get_my_profile(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """🔒 **Authenticated users only.** Returns the logged-in user's profile."""
    return enrich_user_response(session, current_user)


@router.patch(
    "/users/me",
    response_model=UserResponse,
    summary="Update my profile",
)
def update_my_profile(
    body: UserUpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
  
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.phone_number is not None:
        current_user.phone_number = body.phone_number

    updated = user_repo.update_user(session, current_user)
    return enrich_user_response(session, updated)


# ── Admin: User Management ────────────────────────────────────────────────

@router.get(
    "/admin/users",
    response_model=UserListResponse,
    summary="[Admin] List all users",
)
def list_all_users(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Returns a paginated list of all registered users."""
    users, total = user_repo.get_all_users(session, skip=skip, limit=limit)
    enriched_users = [enrich_user_response(session, u) for u in users]

    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.VIEW_AUDIT_LOGS,
        details={"action": "viewed user list", "skip": skip, "limit": limit},
        ip_address=request.client.host if request.client else None,
    )

    return UserListResponse(users=enriched_users, total=total)


@router.patch(
    "/admin/users/{user_id}/block",
    response_model=UserResponse,
    summary="[Admin] Block a user",
)
def block_user(
    user_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Blocks a user from logging in or making transactions."""
    user = user_repo.set_user_active_status(session, user_id, is_active=False)
    if user is None:
        raise NotFoundError(detail=f"User with ID {user_id} not found")

    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.BLOCK_USER,
        details={"blocked_user_id": user_id, "blocked_email": user.email},
        ip_address=request.client.host if request.client else None,
    )
    return enrich_user_response(session, user)


@router.patch(
    "/admin/users/{user_id}/unblock",
    response_model=UserResponse,
    summary="[Admin] Unblock a user",
)
def unblock_user(
    user_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Restores access to a blocked user."""
    user = user_repo.set_user_active_status(session, user_id, is_active=True)
    if user is None:
        raise NotFoundError(detail=f"User with ID {user_id} not found")

    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.UNBLOCK_USER,
        details={"unblocked_user_id": user_id, "unblocked_email": user.email},
        ip_address=request.client.host if request.client else None,
    )
    return enrich_user_response(session, user)
