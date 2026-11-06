
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field

from app.models.enums import RiskLevel, TransactionStatus


class Transaction(SQLModel, table=True):

    __tablename__ = "transactions"

    transaction_id: Optional[int] = Field(default=None, primary_key=True)

    sender_account_id: int = Field(foreign_key="accounts.account_id", index=True)

    receiver_account_id: int = Field(foreign_key="accounts.account_id", index=True)

    receiver_account_number: str = Field(index=True)

    receiver_name: str

    amount: Decimal

    transaction_time: datetime = Field(
        default_factory=lambda: datetime.now(
            tz=timezone(timedelta(hours=5, minutes=30))
        ).replace(tzinfo=None),
        index=True,
    )

    anomaly_score: Optional[float] = Field(default=None)

    risk_level: RiskLevel = Field(default=RiskLevel.LOW)

    status: TransactionStatus = Field(default=TransactionStatus.SUCCESS)