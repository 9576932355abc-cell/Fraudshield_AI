"""
app/routers/fraud_rules.py
─────────────────────────────────────────────
Endpoints (all ADMIN only):
    GET    /admin/fraud-rules        — List all fraud rules
    POST   /admin/fraud-rules        — Create a new fraud rule
    PATCH  /admin/fraud-rules/{id}   — Update a fraud rule
    DELETE /admin/fraud-rules/{id}   — Delete a fraud rule
"""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlmodel import Session

from app.core.dependencies import require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.fraud_rule import (
    FraudRuleCreateRequest,
    FraudRuleUpdateRequest,
    FraudRuleResponse,
)
from app.services import fraud_rule_service, audit_service
from app.models.enums import AuditActionType
from app.utils.response import success_response

router = APIRouter(prefix="/admin/fraud-rules", tags=["Fraud Rules (Admin)"])


@router.get(
    "/",
    response_model=list[FraudRuleResponse],
    summary="[Admin] List fraud rules",
)
def list_fraud_rules(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    active_only: bool = Query(False, description="Filter to show only active rules"),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Returns all configured fraud detection rules."""
    rules, _ = fraud_rule_service.get_all_rules(
        session, skip=skip, limit=limit, active_only=active_only
    )
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.UPDATE_FRAUD_RULE,
        details={"action": "viewed fraud rules list"},
        ip_address=request.client.host if request.client else None,
    )
    return rules


@router.post(
    "/",
    response_model=FraudRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create a fraud rule",
)
def create_fraud_rule(
    request: Request,
    body: FraudRuleCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Creates a new fraud detection threshold rule."""
    rule = fraud_rule_service.create_rule(session, body)
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.CREATE_FRAUD_RULE,
        details={"rule_id": rule.rule_id, "rule_name": rule.rule_name},
        ip_address=request.client.host if request.client else None,
    )
    return rule


@router.patch(
    "/{rule_id}",
    response_model=FraudRuleResponse,
    summary="[Admin] Update a fraud rule",
)
def update_fraud_rule(
    rule_id: int,
    request: Request,
    body: FraudRuleUpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Partially updates a fraud rule by ID."""
    rule = fraud_rule_service.update_rule(session, rule_id, body)
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.UPDATE_FRAUD_RULE,
        details={"rule_id": rule_id, "changes": body.model_dump(exclude_none=True)},
        ip_address=request.client.host if request.client else None,
    )
    return rule


@router.delete(
    "/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete a fraud rule",
)
def delete_fraud_rule(
    rule_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """🔒 **Admin only.** Permanently deletes a fraud rule."""
    fraud_rule_service.delete_rule(session, rule_id)
    audit_service.log_action(
        session=session,
        user_id=current_user.user_id,
        action_type=AuditActionType.DELETE_FRAUD_RULE,
        details={"deleted_rule_id": rule_id},
        ip_address=request.client.host if request.client else None,
    )
