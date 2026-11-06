"""
app/services/alert_service.py
─────────────────────────────────────────────
Purpose:
    Business logic for fraud alert creation and retrieval.
    Called by transaction_service when risk_level == HIGH.
"""

from sqlmodel import Session, select

from app.models.alert import Alert
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.user import User
from app.models.enums import AlertType, RiskLevel
from app.repositories import alert_repo
from app.schemas.alert import AlertResponse
from app.utils.exceptions import NotFoundError


def _enrich_alert(session: Session, alert: Alert) -> AlertResponse:
    """
    Build an AlertResponse from an Alert, joining Transaction → Account → User
    to populate amount, anomaly_score, risk_level, sender_email, receiver_name.
    """
    data = dict(
        alert_id=alert.alert_id,
        transaction_id=alert.transaction_id,
        alert_type=alert.alert_type,
        alert_message=alert.alert_message,
        alert_time=alert.alert_time,
        is_resolved=alert.is_resolved,
    )

    # Join to Transaction
    tx = session.get(Transaction, alert.transaction_id)
    if tx:
        data["amount"] = tx.amount
        data["anomaly_score"] = tx.anomaly_score
        data["risk_level"] = tx.risk_level
        data["receiver_name"] = tx.receiver_name
        data["receiver_account_number"] = tx.receiver_account_number

        # Sender: Account → User
        sender_account = session.get(Account, tx.sender_account_id)
        if sender_account:
            sender_user = session.get(User, sender_account.user_id)
            if sender_user:
                data["sender_email"] = sender_user.email

    return AlertResponse(**data)


def create_fraud_alert(session: Session, transaction: Transaction) -> Alert:
    """
    Automatically create an alert for a HIGH risk transaction.

    Args:
        session: DB session.
        transaction: The flagged Transaction ORM object.

    Returns:
        The persisted Alert object.
    """
    alert_message = (
        f"HIGH risk transaction detected! "
        f"Transaction ID: {transaction.transaction_id} | "
        f"Amount: ₹{transaction.amount:.2f} | "
        f"Anomaly Score: {transaction.anomaly_score:.4f} | "
        f"Receiver Account: {transaction.receiver_account_number}"
    )

    alert = Alert(
        transaction_id=transaction.transaction_id,
        alert_type=AlertType.HIGH_RISK_TRANSACTION,
        alert_message=alert_message,
    )
    return alert_repo.create_alert(session, alert)


def get_user_alerts(
    session: Session,
    account_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[AlertResponse], int]:
    """Fetch enriched alerts for the authenticated user's account transactions."""
    raw_alerts, total = alert_repo.get_alerts_for_account_transactions(
        session, account_id=account_id, skip=skip, limit=limit
    )
    return [_enrich_alert(session, a) for a in raw_alerts], total


def get_all_alerts(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    unresolved_only: bool = False,
) -> tuple[list[AlertResponse], int]:
    """Admin: all enriched alerts with optional unresolved filter."""
    raw_alerts, total = alert_repo.get_all_alerts(
        session, skip=skip, limit=limit, unresolved_only=unresolved_only
    )
    return [_enrich_alert(session, a) for a in raw_alerts], total


def resolve_alert(session: Session, alert_id: int) -> Alert:
    """
    Mark an alert as resolved (admin action).

    Raises:
        NotFoundError: If alert does not exist.
    """
    alert = alert_repo.resolve_alert(session, alert_id)
    if alert is None:
        raise NotFoundError(detail=f"Alert with ID {alert_id} not found")
    return alert
