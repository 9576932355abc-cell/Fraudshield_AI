"""
app/repositories/transaction_repo.py
─────────────────────────────────────────────
Purpose:
    Data Access Layer for the `transactions` table.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlmodel import Session, select, desc, func

from app.models.transaction import Transaction
from app.models.enums import RiskLevel


def count_recent_sender_transactions(
    session: Session,
    sender_account_id: int,
    within_seconds: int = 60,
) -> int:
    """
    Count how many outgoing transactions the sender has made within the
    last `within_seconds` seconds. Used for the rapid-fire fraud rule.
    """
    since = (
        datetime.now(timezone(timedelta(hours=5, minutes=30))).replace(tzinfo=None)
        - timedelta(seconds=within_seconds)
    )
    statement = (
        select(func.count())
        .select_from(Transaction)
        .where(Transaction.sender_account_id == sender_account_id)
        .where(Transaction.transaction_time >= since)
    )
    return session.exec(statement).one()


def get_transaction_by_id(
    session: Session, transaction_id: int
) -> Optional[Transaction]:
    """Fetch a single transaction by primary key."""
    return session.get(Transaction, transaction_id)


def get_transactions_by_account(
    session: Session,
    account_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """
    Fetch all transactions where the given account is sender OR receiver.
    Ordered by most recent first.
    """
    statement = (
        select(Transaction)
        .where(
            (Transaction.sender_account_id == account_id)
            | (Transaction.receiver_account_id == account_id)
        )
        .order_by(desc(Transaction.transaction_time))
    )
    all_transactions = session.exec(statement).all()
    total = len(all_transactions)

    paginated = all_transactions[skip : skip + limit]
    return list(paginated), total


def get_all_transactions(
    session: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """Admin: all transactions, newest first."""
    statement = select(Transaction).order_by(desc(Transaction.transaction_time))
    all_transactions = session.exec(statement).all()
    total = len(all_transactions)
    paginated = all_transactions[skip : skip + limit]
    return list(paginated), total


def get_high_risk_transactions(
    session: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """Admin: only HIGH risk transactions."""
    statement = (
        select(Transaction)
        .where(Transaction.risk_level == RiskLevel.HIGH)
        .order_by(desc(Transaction.transaction_time))
    )
    all_transactions = session.exec(statement).all()
    total = len(all_transactions)
    paginated = all_transactions[skip : skip + limit]
    return list(paginated), total


def create_transaction(session: Session, transaction: Transaction) -> Transaction:
    """Persist a new transaction."""
    session.add(transaction)
    session.flush()
    session.refresh(transaction)
    return transaction


def update_transaction(session: Session, transaction: Transaction) -> Transaction:
    """Update an existing transaction (e.g., after ML response)."""
    session.add(transaction)
    session.flush()
    session.refresh(transaction)
    return transaction
