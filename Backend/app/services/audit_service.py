"""
app/services/audit_service.py
─────────────────────────────────────────────
Purpose:
    Records admin actions to the audit_logs table.
    Every significant admin operation should call `log_action`.

    Placed before other services so they can import it.
"""

import json
from typing import Any, Optional

from sqlmodel import Session

from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.enums import AuditActionType
from app.repositories import audit_log_repo
from app.schemas.audit_log import AuditLogResponse


def log_action(
    session: Session,
    user_id: int,
    action_type: AuditActionType,
    details: Any,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry.

    Args:
        session: Active DB session.
        user_id: ID of the admin user performing the action.
        action_type: AuditActionType enum value.
        details: Any dict/string — will be JSON-encoded.
        ip_address: Optional request IP for security tracing.

    Returns:
        The persisted AuditLog ORM object.
    """
    if isinstance(details, dict):
        details_str = json.dumps(details)
    else:
        details_str = str(details)

    log = AuditLog(
        user_id=user_id,
        action_type=action_type,
        action_details=details_str,
        ip_address=ip_address,
    )
    return audit_log_repo.create_log(session, log)


def _enrich_log(session: Session, log: AuditLog) -> AuditLogResponse:
    """Build an AuditLogResponse with user email and parsed action_details."""
    user_email = None
    user_name = None
    details_parsed = None

    # Lookup user
    user = session.get(User, log.user_id)
    if user:
        user_email = user.email
        user_name = user.full_name

    # Parse action_details JSON
    try:
        details_parsed = json.loads(log.action_details)
    except (json.JSONDecodeError, TypeError):
        details_parsed = log.action_details

    return AuditLogResponse(
        log_id=log.log_id,
        user_id=log.user_id,
        action_type=log.action_type,
        action_details=log.action_details,
        timestamp=log.timestamp,
        ip_address=log.ip_address,
        user_email=user_email,
        user_name=user_name,
        details_parsed=details_parsed,
    )


def get_audit_logs(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    action_type: Optional[AuditActionType] = None,
) -> tuple[list[AuditLogResponse], int]:
    """Retrieve paginated enriched audit logs with optional action type filter."""
    raw_logs, total = audit_log_repo.get_all_logs(
        session, skip=skip, limit=limit, action_type=action_type
    )
    return [_enrich_log(session, log) for log in raw_logs], total
