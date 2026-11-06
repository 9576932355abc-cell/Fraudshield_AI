"""
app/routers/accounts.py
─────────────────────────────────────────────
Endpoints:
    GET /accounts/me — Get own bank account details (USER)
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.dependencies import get_current_user
from app.database import get_session
from app.models.user import User
from app.schemas.account import AccountResponse
from app.services import account_service

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get(
    "/me",
    response_model=AccountResponse,
    summary="Get my bank account",
    description="Returns the bank account details of the authenticated user, including account number and current balance.",
)
def get_my_account(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """🔒 **Authenticated users only.** Returns your bank account details."""
    account = account_service.get_my_account(session, current_user.user_id)
    return account
