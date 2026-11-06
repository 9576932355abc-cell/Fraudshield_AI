"""
app/schemas/account.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for Account API I/O.
"""

from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import AccountType


# ── Response Schemas ──────────────────────────────────────────────────────

class AccountResponse(BaseModel):
    """Account details returned to a user."""
    account_id: int
    user_id: int
    account_number: str
    account_type: AccountType
    balance: Decimal

    model_config = {"from_attributes": True}


class AccountWithUserResponse(AccountResponse):
    """Extended account view for admin — includes owner name."""
    owner_name: str
    owner_email: str
