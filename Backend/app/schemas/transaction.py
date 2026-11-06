"""
app/schemas/transaction.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for Transaction API I/O.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.enums import (
    RiskLevel,
    TransactionStatus,
)


# ==========================================================
# Request Schema
# ==========================================================

class TransferRequest(BaseModel):
    """
    Request body for money transfer.
    """

    receiver_account_number: str
    receiver_name: str
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal):
        if value <= 0:
            raise ValueError(
                "Transfer amount must be greater than zero."
            )

        if value > Decimal("10000000"):
            raise ValueError(
                "Maximum transfer limit is ₹1,00,00,000."
            )

        return value

    @field_validator("receiver_account_number")
    @classmethod
    def validate_account_number(cls, value: str):

        value = value.strip().upper()

        if not value.startswith("ACC"):
            raise ValueError(
                "Account number must start with ACC."
            )

        return value

    @field_validator("receiver_name")
    @classmethod
    def validate_receiver_name(cls, value: str):

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Receiver name is too short."
            )

        return value


# ==========================================================
# Transaction Response
# ==========================================================

class TransactionResponse(BaseModel):

    transaction_id: int

    sender_account_id: int

    receiver_account_id: int

    receiver_account_number: str

    receiver_name: str

    amount: Decimal

    transaction_time: datetime

    anomaly_score: Optional[float] = None

    risk_level: RiskLevel

    status: TransactionStatus

    sender_account_number: Optional[str] = None

    sender_name: Optional[str] = None

    sender_email: Optional[str] = None

    model_config = {
        "from_attributes": True,
    }


# ==========================================================
# Transaction List
# ==========================================================

class TransactionListResponse(BaseModel):

    transactions: list[TransactionResponse]

    total: int