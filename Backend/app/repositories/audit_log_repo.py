

from typing import Optional

from sqlmodel import Session, select, desc

from app.models.audit_log import AuditLog
from app.models.enums import AuditActionType


def get_log_by_id(session: Session, log_id: int) -> Optional[AuditLog]:
    return session.get(AuditLog, log_id)


def get_all_logs(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    action_type: Optional[AuditActionType] = None,
) -> tuple[list[AuditLog], int]:
    """
    Admin: paginated audit trail, optionally filtered by action type.
    Ordered by most recent first.
    """
    statement = select(AuditLog).order_by(desc(AuditLog.timestamp))

    if action_type is not None:
        statement = statement.where(AuditLog.action_type == action_type)

    all_logs = session.exec(statement).all()
    total = len(all_logs)
    paginated = all_logs[skip : skip + limit]
    return list(paginated), total


def get_logs_by_user(
    session: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[AuditLog], int]:
    """Fetch audit logs for a specific admin user."""
    statement = (
        select(AuditLog)
        .where(AuditLog.user_id == user_id)
        .order_by(desc(AuditLog.timestamp))
    )
    all_logs = session.exec(statement).all()
    total = len(all_logs)
    paginated = all_logs[skip : skip + limit]
    return list(paginated), total


def create_log(session: Session, log: AuditLog) -> AuditLog:
    """Persist a new audit log entry."""
    session.add(log)
    session.flush()
    session.refresh(log)
    return log
