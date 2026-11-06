"""
app/services/fraud_rule_service.py
─────────────────────────────────────────────
Purpose:
    Business logic for Admin CRUD operations on FraudRules.
"""

from sqlmodel import Session

from app.models.fraud_rule import FraudRule
from app.repositories import fraud_rule_repo
from app.schemas.fraud_rule import FraudRuleCreateRequest, FraudRuleUpdateRequest
from app.utils.exceptions import NotFoundError, ConflictError


def get_all_rules(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = False,
) -> tuple[list[FraudRule], int]:
    return fraud_rule_repo.get_all_rules(
        session, active_only=active_only, skip=skip, limit=limit
    )


def create_rule(session: Session, data: FraudRuleCreateRequest) -> FraudRule:
    """
    Create a new fraud detection rule.

    Raises:
        ConflictError: If rule_name already exists.
    """
    existing = fraud_rule_repo.get_rule_by_name(session, data.rule_name)
    if existing:
        raise ConflictError(detail=f"A fraud rule named '{data.rule_name}' already exists")

    rule = FraudRule(
        rule_name=data.rule_name,
        threshold_value=data.threshold_value,
        description=data.description,
    )
    return fraud_rule_repo.create_rule(session, rule)


def update_rule(
    session: Session, rule_id: int, data: FraudRuleUpdateRequest
) -> FraudRule:
    """
    Partially update a fraud rule.

    Raises:
        NotFoundError: If rule does not exist.
    """
    rule = fraud_rule_repo.get_rule_by_id(session, rule_id)
    if rule is None:
        raise NotFoundError(detail=f"Fraud rule with ID {rule_id} not found")

    if data.rule_name is not None:
        rule.rule_name = data.rule_name
    if data.threshold_value is not None:
        rule.threshold_value = data.threshold_value
    if data.description is not None:
        rule.description = data.description
    if data.is_active is not None:
        rule.is_active = data.is_active

    return fraud_rule_repo.update_rule(session, rule)


def delete_rule(session: Session, rule_id: int) -> None:
    """
    Delete a fraud rule.

    Raises:
        NotFoundError: If rule does not exist.
    """
    deleted = fraud_rule_repo.delete_rule(session, rule_id)
    if not deleted:
        raise NotFoundError(detail=f"Fraud rule with ID {rule_id} not found")
