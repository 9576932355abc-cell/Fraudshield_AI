"""
app/schemas/alert.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for Alert API I/O.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.enums import AlertType, RiskLevel


# ── Response Schemas ──────────────────────────────────────────────────────

class AlertResponse(BaseModel):
    alert_id: int
    transaction_id: int
    alert_type: AlertType
    alert_message: str
    alert_time: datetime
    is_resolved: bool

    # Enriched from the linked transaction
    amount: Optional[Decimal] = None
    anomaly_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    sender_email: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_account_number: Optional[str] = None

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int
