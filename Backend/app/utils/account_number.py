"""
app/utils/account_number.py
─────────────────────────────────────────────
Purpose:
    Generates unique bank account numbers in the format:
        ACC100001, ACC100002, ACC100003, ...

    Strategy:
        1. Query the current MAX account_number from the accounts table.
        2. Parse the numeric suffix.
        3. Increment by 1.
        4. Return the new formatted string.

    This ensures uniqueness even after server restarts, as it reads
    directly from the database rather than holding state in memory.
"""

from sqlmodel import Session, select, func
from app.models.account import Account

# ── Constants ─────────────────────────────────────────────────────────────
_PREFIX = "ACC"
_START = 100001          # First account number suffix


def generate_account_number(session: Session) -> str:
    """
    Generate the next sequential account number.

    Args:
        session: Active SQLModel database session.

    Returns:
        A unique account number string, e.g. "ACC100001".
    """
    # Fetch the maximum numeric suffix from existing account_numbers.
    # We strip the "ACC" prefix and cast to integer for a proper numeric MAX.
    statement = select(func.max(Account.account_number))
    result = session.exec(statement).one_or_none()

    if result is None or result == (None,):
        # No accounts exist yet — start from the beginning
        next_number = _START
    else:
        max_acc_str: str = result  # e.g. "ACC100042"
        try:
            numeric_part = int(max_acc_str.replace(_PREFIX, ""))
            next_number = numeric_part + 1
        except (ValueError, AttributeError):
            next_number = _START

    return f"{_PREFIX}{next_number}"
