

from typing import Optional

from sqlmodel import Session, select

from app.models.fraud_rule import FraudRule


def get_rule_by_id(session: Session, rule_id: int) -> Optional[FraudRule]:
    return session.get(FraudRule, rule_id)


def get_rule_by_name(session: Session, rule_name: str) -> Optional[FraudRule]:
    statement = select(FraudRule).where(FraudRule.rule_name == rule_name)
    return session.exec(statement).first()


def get_all_rules(
    session: Session,
    active_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[FraudRule], int]:
    """
    List fraud rules, optionally filtering to only active ones.
    Used by the transaction service to evaluate transactions.
    """
    statement = select(FraudRule)
    if active_only:
        statement = statement.where(FraudRule.is_active == True)

    all_rules = session.exec(statement).all()
    total = len(all_rules)
    paginated = all_rules[skip : skip + limit]
    return list(paginated), total


def create_rule(session: Session, rule: FraudRule) -> FraudRule:
    session.add(rule)
    session.flush()
    session.refresh(rule)
    return rule


def update_rule(session: Session, rule: FraudRule) -> FraudRule:
    session.add(rule)
    session.flush()
    session.refresh(rule)
    return rule


def delete_rule(session: Session, rule_id: int) -> bool:
    """Delete a fraud rule. Returns True if deleted, False if not found."""
    rule = session.get(FraudRule, rule_id)
    if rule is None:
        return False
    session.delete(rule)
    session.flush()
    return True
