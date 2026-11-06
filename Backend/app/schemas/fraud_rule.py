"""
app/schemas/fraud_rule.py
─────────────────────────────────────────────
Purpose:
    Pydantic schemas for FraudRule CRUD API I/O.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


# ── Request Schemas ───────────────────────────────────────────────────────

class FraudRuleCreateRequest(BaseModel):
    """Body for POST /admin/fraud-rules"""
    rule_name: str
    threshold_value: Decimal
    description: str

    @field_validator("threshold_value")
    @classmethod
    def validate_threshold(cls, v: Decimal) -> Decimal:
        if v < 0 or v > 1:
            raise ValueError("Threshold value must be between 0.0 and 1.0")
        return v

    @field_validator("rule_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Rule name must be at least 3 characters")
        return v


class FraudRuleUpdateRequest(BaseModel):
    """Body for PATCH /admin/fraud-rules/{id} — all fields optional"""
    rule_name: Optional[str] = None
    threshold_value: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# ── Response Schemas ──────────────────────────────────────────────────────

class FraudRuleResponse(BaseModel):
    rule_id: int
    rule_name: str
    threshold_value: Decimal
    description: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
