
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field


class FraudRule(SQLModel, table=True):

    __tablename__ = "fraud_rules"

    rule_id: Optional[int] = Field(default=None, primary_key=True)

    rule_name: str = Field(unique=True, index=True)

    threshold_value: Decimal

    description: str

    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)