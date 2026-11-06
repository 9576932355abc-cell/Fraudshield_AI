"""
app/routers/alerts.py
─────────────────────────────────────────────
Endpoints:
    GET   /alerts/               — My alerts (USER)
    GET   /admin/alerts          — All alerts (ADMIN)
    PATCH /admin/alerts/{id}/resolve — Resolve an alert (ADMIN)
"""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.dependencies import get_current_user, require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertListResponse
from app.services import alert_service, account_service, audit_service
from app.models.enums import AuditActionType

router = APIRouter(tags=["Alerts"])
@router.get(
    "/alerts/",
    response_model=AlertListResponse,
    summary="My fraud alerts",
)
def get_my_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """🔒 **Authenticated users only.** Returns fraud alerts for your transactions."""
    account = account_service.get_my_account(session, current_user.user_id)
    alerts, total = alert_service.get_user_alerts(
        session, account_id=account.account_id, skip=skip, limit=limit
    )
    return AlertListResponse(alerts=alerts, total=total)


@router.get(
    "/admin/alerts",
    response_model=AlertListResponse,
    summary="[Admin] All fraud alerts",
)
def get_all_alerts(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    unresolved_only: bool = Query(False, description="Show only unresolved alerts"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Returns all fraud alerts system-wide."""
    alerts, total = alert_service.get_all_alerts(
        session, skip=skip, limit=limit, unresolved_only=unresolved_only
    )
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.VIEW_ALERTS,
        details={"action": "viewed all alerts", "unresolved_only": unresolved_only},
        ip_address=request.client.host if request.client else None,
    )
    return AlertListResponse(alerts=alerts, total=total)


@router.patch(
    "/admin/alerts/{alert_id}/resolve",
    response_model=AlertResponse,
    summary="[Admin] Resolve an alert",
)
def resolve_alert(
    alert_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Marks a fraud alert as resolved."""
    raw_alert = alert_service.resolve_alert(session, alert_id)
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.VIEW_ALERTS,
        details={"action": "resolved alert", "alert_id": alert_id},
        ip_address=request.client.host if request.client else None,
    )
    # Return enriched response
    from app.services.alert_service import _enrich_alert
    return _enrich_alert(session, raw_alert)

