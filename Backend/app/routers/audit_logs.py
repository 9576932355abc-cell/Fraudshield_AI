"""
app/routers/audit_logs.py
─────────────────────────────────────────────
Endpoints:
    GET /admin/audit-logs — List audit trail (ADMIN)
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session

from app.core.dependencies import require_admin
from app.database import get_session
from app.models.user import User
from app.models.enums import AuditActionType
from app.schemas.audit_log import AuditLogListResponse
from app.services import audit_service

router = APIRouter(prefix="/admin/audit-logs", tags=["Audit Logs (Admin)"])


@router.get(
    "/",
    response_model=AuditLogListResponse,
    summary="[Admin] View audit trail",
    description=(
        "Returns a paginated audit trail of all admin actions. "
        "Can be filtered by action type."
    ),
)
def get_audit_logs(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action_type: Optional[AuditActionType] = Query(
        None, description="Filter by specific action type"
    ),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """
    🔒 **Admin only.**

    Returns all audit log entries showing who did what and when.
    Filter by `action_type` to see specific categories of actions.
    """
    logs, total = audit_service.get_audit_logs(
        session, skip=skip, limit=limit, action_type=action_type
    )

    # Self-audit: log that admin viewed audit logs
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.VIEW_AUDIT_LOGS,
        details={"action": "viewed audit logs", "filter": action_type.value if action_type else None},
        ip_address=request.client.host if request.client else None,
    )

    return AuditLogListResponse(logs=logs, total=total)
