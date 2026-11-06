

from typing import Optional

from sqlmodel import Session, select

from app.models.account import Account


def get_account_by_id(session: Session, account_id: int) -> Optional[Account]:
    """Fetch account by primary key."""
    return session.get(Account, account_id)


def get_account_by_user_id(session: Session, user_id: int) -> Optional[Account]:
    """Fetch the account belonging to a specific user."""
    statement = select(Account).where(Account.user_id == user_id)
    return session.exec(statement).first()


def get_account_by_number(
    session: Session, account_number: str
) -> Optional[Account]:
    """Fetch account by its unique account number (e.g. ACC100001)."""
    statement = select(Account).where(Account.account_number == account_number)
    return session.exec(statement).first()


def create_account(session: Session, account: Account) -> Account:
    """Persist a new account to the database."""
    session.add(account)
    session.flush()
    session.refresh(account)
    return account


def update_account(session: Session, account: Account) -> Account:
    """Save balance or field changes to an existing account."""
    session.add(account)
    session.flush()
    session.refresh(account)
    return account
