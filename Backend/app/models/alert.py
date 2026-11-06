
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import AlertType


class Alert(SQLModel, table=True):

    __tablename__ = "alerts"

    alert_id: Optional[int] = Field(default=None, primary_key=True)

    transaction_id: int = Field(foreign_key="transactions.transaction_id", index=True)

    alert_type: AlertType = Field(default=AlertType.HIGH_RISK_TRANSACTION)

    alert_message: str

    alert_time: datetime = Field(default_factory=datetime.utcnow, index=True)

    is_resolved: bool = Field(default=False)