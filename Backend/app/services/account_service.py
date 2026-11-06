"""
app/services/account_service.py
─────────────────────────────────────────────
Purpose:
    Business logic for bank account management.
    Called automatically during signup and by account routers.
"""

from decimal import Decimal

from sqlmodel import Session

from app.models.account import Account
from app.models.enums import AccountType
from app.repositories import account_repo
from app.utils.account_number import generate_account_number
from app.utils.exceptions import AccountNotFoundError


def create_account_for_user(
    session: Session,
    user_id: int,
    account_type: AccountType = AccountType.SAVINGS,
) -> Account:
    """
    Create a new bank account for a user.
    Called automatically after signup — never directly by the user.

    Args:
        session: DB session.
        user_id: ID of the owning user.
        account_type: Defaults to SAVINGS.

    Returns:
        The newly created Account ORM object.
    """
    account_number = generate_account_number(session)

    account = Account(
        user_id=user_id,
        account_number=account_number,
        account_type=account_type,
        balance=Decimal("100000.00"),   # welcome balance on signup
    )
    return account_repo.create_account(session, account)


def get_my_account(session: Session, user_id: int) -> Account:
    """
    Fetch the bank account belonging to the authenticated user.

    Raises:
        AccountNotFoundError: If no account exists for this user.
    """
    account = account_repo.get_account_by_user_id(session, user_id)
    if account is None:
        raise AccountNotFoundError(f"No account found for user {user_id}")
    return account
