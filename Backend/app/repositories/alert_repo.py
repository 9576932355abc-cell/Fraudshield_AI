

from typing import Optional

from sqlmodel import Session, select, desc

from app.models.alert import Alert


def get_alert_by_id(session: Session, alert_id: int) -> Optional[Alert]:
    return session.get(Alert, alert_id)


def get_alerts_by_transaction(
    session: Session, transaction_id: int
) -> list[Alert]:
    """Fetch all alerts linked to a specific transaction."""
    statement = select(Alert).where(Alert.transaction_id == transaction_id)
    return list(session.exec(statement).all())


def get_all_alerts(
    session: Session,
    skip: int = 0,
    limit: int = 50,
    unresolved_only: bool = False,
) -> tuple[list[Alert], int]:
    """Admin: paginated list of all alerts."""
    statement = select(Alert).order_by(desc(Alert.alert_time))
    if unresolved_only:
        statement = statement.where(Alert.is_resolved == False)

    all_alerts = session.exec(statement).all()
    total = len(all_alerts)
    paginated = all_alerts[skip : skip + limit]
    return list(paginated), total


def get_alerts_for_account_transactions(
    session: Session,
    account_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Alert], int]:
    """
    Fetch alerts for transactions where the given account is the sender.
    Used by regular users to view their own alerts.
    """
    from app.models.transaction import Transaction

    statement = (
        select(Alert)
        .join(Transaction, Alert.transaction_id == Transaction.transaction_id)
        .where(Transaction.sender_account_id == account_id)
        .order_by(desc(Alert.alert_time))
    )
    all_alerts = session.exec(statement).all()
    total = len(all_alerts)
    paginated = all_alerts[skip : skip + limit]
    return list(paginated), total


def create_alert(session: Session, alert: Alert) -> Alert:
    session.add(alert)
    session.flush()
    session.refresh(alert)
    return alert


def resolve_alert(session: Session, alert_id: int) -> Optional[Alert]:
    """Mark an alert as resolved. Returns updated alert or None."""
    alert = session.get(Alert, alert_id)
    if alert is None:
        return None
    alert.is_resolved = True
    session.add(alert)
    session.flush()
    session.refresh(alert)
    return alert
