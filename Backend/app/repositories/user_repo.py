"""
app/repositories/user_repo.py
─────────────────────────────────────────────
Purpose:
    Data Access Layer for the `users` table.
    All database queries involving users live here.
    Services call these functions — no SQL escapes into the service layer.
"""

from typing import Optional

from sqlmodel import Session, select

from app.models.user import User


def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    """Fetch a single user by primary key."""
    return session.get(User, user_id)


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Fetch a user by email (used for login lookup)."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_user_by_phone(session: Session, phone_number: str) -> Optional[User]:
    """Fetch a user by phone number (used for uniqueness check)."""
    statement = select(User).where(User.phone_number == phone_number)
    return session.exec(statement).first()


def get_all_users(
    session: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[User], int]:
    """
    Admin: Paginated list of all users.

    Returns:
        Tuple of (users list, total count).
    """
    count_statement = select(User)
    total = len(session.exec(count_statement).all())

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return list(users), total


def create_user(session: Session, user: User) -> User:
    """Persist a new user to the database."""
    session.add(user)
    session.flush()   # populate user_id without committing
    session.refresh(user)
    return user


def update_user(session: Session, user: User) -> User:
    """Persist changes to an existing user."""
    session.add(user)
    session.flush()
    session.refresh(user)
    return user


def set_user_active_status(
    session: Session, user_id: int, is_active: bool
) -> Optional[User]:
    """
    Block or unblock a user. Returns the updated user, or None if not found.
    """
    user = session.get(User, user_id)
    if user is None:
        return None
    user.is_active = is_active
    session.add(user)
    session.flush()
    session.refresh(user)
    return user
